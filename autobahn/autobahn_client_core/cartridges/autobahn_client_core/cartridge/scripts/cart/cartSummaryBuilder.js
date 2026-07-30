'use strict';

var Money = require('dw/value/Money');
var StringUtils = require('dw/util/StringUtils');
var Currency = require('dw/util/Currency');
var Logger = require('dw/system/Logger');


function getFormattedPrice(value, basket) {
    var globaleSession = require('*/cartridge/models/globale/session');
    var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
    var basketCurrency = (basket && basket.getCurrencyCode && basket.getCurrencyCode()) || 'USD';
    var currencyCode = globaleSession.get('geCurrency') || basketCurrency;
    var valueMoney = new Money(value, currencyCode);
    var gMoney = globaleMoney(valueMoney.valueOrNull, currencyCode, valueMoney);
    var formatted = gMoney.toFormattedString();

    if (currencyCode == 'USD') {
        formatted = StringUtils.formatMoney(valueMoney);
    }
    return {
        value: value,
        formatted: formatted
    };
}

function getEstimatedValue(currentBasket) {
    try {
        const estimatedTotal = currentBasket.getAdjustedMerchandizeTotalNetPrice();
        if (!estimatedTotal) {
            return 0;
        }
        return getFormattedPrice(estimatedTotal.value);
    } catch (e) {
        Logger.getLogger('CartSummary').error('Error calculating estimated value: {0}', e);
        return 0;
    }
}

var getTotalBasePrice = function(basket) {
    var totalBasePriceValue = 0;
    if (basket) {
        // Extract all product and coupon line items
        var productLineItems = basket.getAllProductLineItems().toArray();
        productLineItems.forEach(function (item) {
            var basePriceVal = item.getBasePrice() ? item.getBasePrice().value : 0;
            totalBasePriceValue += basePriceVal;
        });
    }
    return getFormattedPrice(totalBasePriceValue, basket);
}

// Calculate total coupon discount on a placed Order
function getTotalCouponDiscount(order) {
    var productCouponDiscountValue = 0;
    var orderCouponDiscountValue = 0;

    try {
        if (order) {
            var couponLineItems = order.getCouponLineItems && order.getCouponLineItems();
            var couponPromotionIDs = [];

            if (couponLineItems && couponLineItems.size() > 0) {
                couponLineItems.toArray().forEach(function (coupon) {
                    if (coupon) {
                        var promo = coupon.getPromotion && coupon.getPromotion();
                        if (promo) {
                            couponPromotionIDs.push(promo.getID());
                        }
                    }
                });
            }

            var productLineItems = order.getProductLineItems && order.getProductLineItems();
            if (productLineItems && productLineItems.size() > 0) {
                productLineItems.toArray().forEach(function (pli) {
                    if (pli && pli.getPriceAdjustments) {
                        var adjustments = pli.getPriceAdjustments();
                        if (adjustments && adjustments.size() > 0) {
                            adjustments.toArray().forEach(function (adj) {
                                var promoID = adj.getPromotionID && adj.getPromotionID();
                                if (promoID && couponPromotionIDs.includes(promoID)) {
                                    var price = adj.getPrice && adj.getPrice();
                                    var discountVal = price ? price.value : 0;
                                    productCouponDiscountValue += discountVal;
                                }
                            });
                        }
                    }
                });
            }

            var orderAdjustments = order.getPriceAdjustments && order.getPriceAdjustments();
            if (orderAdjustments && orderAdjustments.size() > 0) {
                orderAdjustments.toArray().forEach(function (adj) {
                    var promoID = adj.getPromotionID && adj.getPromotionID();
                    if (promoID && couponPromotionIDs.includes(promoID)) {
                        var price = adj.getPrice && adj.getPrice();
                        var discountVal = price ? price.value : 0;
                        orderCouponDiscountValue += discountVal;
                    }
                });
            }
        }
    } catch (e) {
        Logger.getLogger('OrderConfirmationSummary').error('Error calculating total coupon discount: {0}', e.stack || e.message);
    }

    var totalCouponDiscountValue = productCouponDiscountValue + orderCouponDiscountValue;
    return getFormattedPrice(productCouponDiscountValue, order);
}

/**
 * Builds a structured summary of the cart, including pricing and applied coupon data.
 * @param {dw.order.Basket} basket - The current basket object
 * @returns {Object} cartSummary - Structured data for use in templates, APIs, etc.
 */

var cartSummaryBuilder = function (basket) {
    var productIDs = [];
    var hasCoupons = false;
    var hasAppliedCoupons = false;
    var appliedCouponCodes = [];
    var productCouponDiscountValue = 0;
    var orderCouponDiscountValue = 0;
    var totalBasePriceValue = 0;
    var totalAdjustedPriceValue = 0;
    var couponPromotionIDs = [];
    var products = [];

    try {
        if (basket) {
            // Extract all product and coupon line items
            var productLineItems = basket.getAllProductLineItems().toArray();
            var couponLineItems = basket.getCouponLineItems().toArray();

            // Track all coupons and their associated promotion IDs
            var couponMap = {};
            hasCoupons = couponLineItems.length > 0;
            hasAppliedCoupons = couponLineItems.some(function (coupon) {
                return coupon.isApplied();
            });

            // Map coupon codes to their promotions
            couponLineItems.forEach(function (coupon) {
                var promo = coupon.getPromotion();
                if (promo) {
                    var promoID = promo.getID();
                    var code = coupon.getCouponCode();
                    appliedCouponCodes.push(code);
                    couponPromotionIDs.push(promoID);

                    couponMap[promoID] = {
                        couponCode: code,
                        isApplied: coupon.isApplied()
                    };
                }
            });

            // Process each product line item
            productLineItems.forEach(function (item) {
                var pid = item.productID;
                var basePriceVal = item.getBasePrice() ? item.getBasePrice().value : 0;
                var finalPriceVal = item.getAdjustedPrice() ? item.getAdjustedPrice().value : 0;

                totalBasePriceValue += basePriceVal;
                totalAdjustedPriceValue += finalPriceVal;
                productIDs.push(pid);

                var couponsApplied = [];

                // Capture coupon-related price adjustments
                item.getPriceAdjustments().toArray().forEach(function (adj) {
                    var promoID = adj.promotionID;
                    if (promoID && couponMap[promoID]) {
                        var discountVal = adj.getPrice() ? adj.getPrice().value : 0;
                        couponsApplied.push({
                            couponCode: couponMap[promoID].couponCode,
                            isApplied: couponMap[promoID].isApplied,
                            discount: getFormattedPrice(discountVal, basket)
                        });
                        productCouponDiscountValue += discountVal;
                    }
                });

                // Append product data with price and coupon info
                products.push({
                    pid: pid,
                    basePrice: getFormattedPrice(basePriceVal, basket),
                    finalPrice: getFormattedPrice(finalPriceVal, basket),
                    couponsApplied: couponsApplied
                });
            });

            // Calculate order-level discounts from applied coupons
            orderCouponDiscountValue = basket.getPriceAdjustments().toArray().reduce(function (sum, adj) {
                return couponPromotionIDs.includes(adj.promotionID)
                    ? sum + (adj.getPrice() ? adj.getPrice().value : 0)
                    : sum;
            }, 0);
        }
    } catch (e) {
        Logger.getLogger('CartSummary').error('Cart summary error: {0}', e.stack || e.message);
    }

    // Final coupon discount sum (product-level + order-level)
    var totalCouponDiscountValue = productCouponDiscountValue + orderCouponDiscountValue;

    // Estimated total
    const estimatedTotal = getEstimatedValue(basket);

    // Final cart summary structure
    return {
        cart: {
            productIDs: productIDs,
            hasCoupons: hasCoupons,
            hasAppliedCoupons: hasAppliedCoupons,
            appliedCouponCodes: appliedCouponCodes,
            totalBasePrice: getFormattedPrice(totalBasePriceValue, basket),
            totalAdjustedPrice: getFormattedPrice(totalAdjustedPriceValue, basket),
            productCouponDiscount: getFormattedPrice(productCouponDiscountValue, basket),
            orderCouponDiscount: getFormattedPrice(orderCouponDiscountValue, basket),
            totalCouponDiscount: getFormattedPrice(totalCouponDiscountValue, basket),
            estimatedTotal: estimatedTotal
        },
        products: products
    };
};

module.exports = {
    getCartSummary: cartSummaryBuilder,
    getTotalCouponDiscount: getTotalCouponDiscount,
    getTotalBasePrice: getTotalBasePrice
};
