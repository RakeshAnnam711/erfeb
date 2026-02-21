'use strict';

var Promotion = require('dw/campaign/Promotion');

var collections = require('*/cartridge/scripts/util/collections');
var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
var globaleSession = require('*/cartridge/models/globale/session');
var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');
var geOrderMgr = require('*/cartridge/scripts/factories/globale/dw/order');
var base = module.superModule;

/**
 * Accepts a total object and formats the value
 * @param {dw.value.Money} total - Total price of the cart
 * @returns {string} the formatted money value
 */
function getBasketTotals(total) {
    if (!total.available) {
        return '-';
    }
    return globaleMoney(total.valueOrNull, globaleSession.get('geCurrency'), total).toFormattedString();
}

/**
 * Gets the Basket discount amount by subtracting the basket's total including the discount from
 *      the basket's total excluding the order discount.
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket
 * @returns {Object} an object that contains the value and formatted value of the order discount
 */
function getBasketLevelDiscountTotal(lineItemContainer) {
    var totalExcludingOrderDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice(false);
    var totalIncludingOrderDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice(true);
    var orderDiscount = totalExcludingOrderDiscount.subtract(totalIncludingOrderDiscount);
    var formattedMoney = globaleMoney(orderDiscount.valueOrNull, globaleSession.get('geCurrency'), orderDiscount).toFormattedString();

    return {
        value: orderDiscount.value,
        formatted: formattedMoney
    };
}

/**
 * Gets Global-e Order shipping discount
 * @param {dw.order.Order} order - SFCC Order
 * @returns {Object} - an object that contains the value and formatted value of the Global-e Order shipping discount
 */
function getShippingLevelDiscountTotal(order) {
    var shippingPrice = 0;
    var shippingDiscountedPrice = 0;
    var shippingDiscountPrice;
    var currencyCode = order.currencyCode;
    if ((globaleHelpers.customAttr.order.geCustomerCurrencyCode in order.custom) && order.custom[globaleHelpers.customAttr.order.geCustomerCurrencyCode] !== null) {
        currencyCode = order.custom[globaleHelpers.customAttr.order.geCustomerCurrencyCode];
    }
    shippingDiscountPrice = globaleMoney((shippingPrice - shippingDiscountedPrice), currencyCode);
    var formattedMoney = shippingDiscountPrice.toFormattedString();
    return {
        value: shippingDiscountPrice.value,
        formatted: formattedMoney
    };
}

/**
 * Adds discounts to a discounts object
 * @param {dw.util.Collection} collection - a collection of price adjustments
 * @param {Object} discounts - an object of price adjustments
 * @param {boolean|undefined} isGlobaleOrder - If it's Global-e Order = true, otherwise = false
 * @returns {Object} an object of price adjustments
 */
function createDiscountObject(collection, discounts, isGlobaleOrder) {
    var result = discounts;
    var currencyCode;
    collections.forEach(collection, function (item) {
        if (!item.basedOnCoupon) {
            var formattedItemPrice;
            var discountPrice;
            if (isGlobaleOrder && item.lineItemCtnr) {
                currencyCode = item.lineItemCtnr.currencyCode;
                if ((globaleHelpers.customAttr.order.geCustomerCurrencyCode in item.lineItemCtnr.custom) && item.lineItemCtnr.custom[globaleHelpers.customAttr.order.geCustomerCurrencyCode] !== null) {
                    currencyCode = item.lineItemCtnr.custom[globaleHelpers.customAttr.order.geCustomerCurrencyCode];
                }
                discountPrice = 0;
                if ((globaleHelpers.customAttr.priceAdjustment.geInternationalPrice in item.custom) && item.custom[globaleHelpers.customAttr.priceAdjustment.geInternationalPrice] !== null) {
                    discountPrice = item.custom[globaleHelpers.customAttr.priceAdjustment.geInternationalPrice];
                }
                discountPrice = globaleMoney(-discountPrice, currencyCode);
                formattedItemPrice = discountPrice.toFormattedString();
            } else {
                formattedItemPrice = globaleMoney(item.price.valueOrNull, globaleSession.get('geCurrency'), item.price).toFormattedString();
            }
            result[item.UUID] = {
                UUID: item.UUID,
                lineItemText: item.lineItemText,
                price: ((item.promotion && item.promotion.promotionClass === Promotion.PROMOTION_CLASS_SHIPPING && globaleSession.get('geOperatedCountry')) ? '' : formattedItemPrice),
                type: 'promotion',
                callOutMsg: (('promotion' in item) && item.promotion && item.promotion.calloutMsg)
            };
        }
    });

    return result;
}

/**
 * creates an array of discounts.
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @param {boolean|undefined} isGlobaleOrder - If it's Global-e Order = true, otherwise = false
 * @returns {Array} an array of objects containing promotion and coupon information
 */
function getDiscounts(lineItemContainer, isGlobaleOrder) {
    var lineItemContainers = [lineItemContainer];
    if (isGlobaleOrder) {
        var geOrder = geOrderMgr.get(lineItemContainer);
        // handle Mixed order scenario
        if (geOrder.geIsMixedMainOrder()) {
            lineItemContainers = lineItemContainers.concat(geOrder.geGetMixedSubOrders());
        }
    }
    var globalePromotion = require('*/cartridge/scripts/factories/globale/promotion');
    var discounts = {};

    lineItemContainers.forEach(function (liCtnr) {
        collections.forEach(liCtnr.couponLineItems, function (couponLineItem) {
            var priceAdjustments = collections.map(couponLineItem.priceAdjustments, function (priceAdjustment) {
                return { callOutMsg: (priceAdjustment.promotion ? priceAdjustment.promotion.calloutMsg : '') };
            });
            var applied = couponLineItem.applied;
            if (!isGlobaleOrder && globaleSession.get('geOperatedCountry')) {
                var promotion = globalePromotion(couponLineItem.promotion);
                if (promotion) {
                    applied = promotion.isGlobalePromotion() && (couponLineItem.priceAdjustments.length > 0);
                }
            }
            discounts[couponLineItem.UUID] = {
                type: 'coupon',
                UUID: couponLineItem.UUID,
                couponCode: couponLineItem.couponCode,
                applied: applied,
                valid: couponLineItem.valid,
                relationship: priceAdjustments
            };
        });

        discounts = createDiscountObject(liCtnr.priceAdjustments, discounts, isGlobaleOrder);
        discounts = createDiscountObject(liCtnr.allShippingPriceAdjustments, discounts, isGlobaleOrder);
    });

    return Object.keys(discounts).map(function (key) {
        return discounts[key];
    });
}

/**
 * create the discount results html
 * @param {Array} discounts - an array of objects that contains coupon and priceAdjustment
 * information
 * @returns {string} The rendered HTML
 */
function getDiscountsHtml(discounts) {
    var HashMap = require('dw/util/HashMap');
    var Template = require('dw/util/Template');
    var context = new HashMap();
    var object = { totals: { discounts: discounts } };

    Object.keys(object).forEach(function (key) {
        context.put(key, object[key]);
    });

    var template = new Template('cart/cartCouponDisplay');
    return template.render(context).text;
}

/**
 * Calculates Global-e Order Duties and formats the value
 * @param {dw.order.Order} order - SFCC Order
 * @returns {string} the formatted money value
 */
function getTotalDutiesPrice(order) {
    var orders = [order];
    var geOrder = geOrderMgr.get(order);
    // handle Mixed order scenario
    if (geOrder.geIsMixedMainOrder()) {
        orders = orders.concat(geOrder.geGetMixedSubOrders());
    }
    var totalDutiesPrice = null;
    var currencyCode = order.currencyCode;
    if ((globaleHelpers.customAttr.order.geCustomerCurrencyCode in order.custom) && order.custom[globaleHelpers.customAttr.order.geCustomerCurrencyCode] !== null) {
        currencyCode = order.custom[globaleHelpers.customAttr.order.geCustomerCurrencyCode];
    }
    orders.forEach(function (orderItem) {
        if ((globaleHelpers.customAttr.order.geTotalDutiesPrice in orderItem.custom) && orderItem.custom[globaleHelpers.customAttr.order.geTotalDutiesPrice]) {
            totalDutiesPrice = globaleMoney(order.custom[globaleHelpers.customAttr.order.geTotalDutiesPrice], currencyCode).toFormattedString();
        }
    });
    return totalDutiesPrice;
}

/**
 * @constructor
 * @classdesc totals class that represents the order totals of the current line item container
 *
 * @param {dw.order.lineItemContainer} lineItemContainer - The current user's line item container
 */
function totals(lineItemContainer) {
    var Basket = require('dw/order/Basket');
    var TaxMgr = require('dw/order/TaxMgr');
    var isGlobaleBasket = false;
    if (lineItemContainer && (lineItemContainer instanceof Basket) && globaleSession.get('geOperatedCountry')) {
        isGlobaleBasket = true;
    }
    var isGlobaleOrder = false;
    if (
        lineItemContainer
        && !isGlobaleBasket
        && (globaleHelpers.customAttr.order.geOrderNumber in lineItemContainer.custom)
        && lineItemContainer.custom[globaleHelpers.customAttr.order.geOrderNumber]
    ) {
        isGlobaleOrder = true;
    }
    if (isGlobaleBasket || isGlobaleOrder) {
        // empty LineItemContainer
        if (!lineItemContainer) {
            this.subTotal = '-';
            this.grandTotal = '-';
            this.orderLevelDiscountTotal = '-';
            this.shippingLevelDiscountTotal = '-';
            this.priceAdjustments = null;
        // Global-e Basket
        } else if (isGlobaleBasket) {
            this.subTotal = getBasketTotals(lineItemContainer.getAdjustedMerchandizeTotalPrice(false));
            this.orderLevelDiscountTotal = getBasketLevelDiscountTotal(lineItemContainer);
            this.grandTotal = getBasketTotals(lineItemContainer[TaxMgr.taxationPolicy === TaxMgr.TAX_POLICY_NET ? 'totalNetPrice' : 'totalGrossPrice']);
            this.discounts = getDiscounts(lineItemContainer);
            this.discountsHtml = getDiscountsHtml(this.discounts);
            this.totalTax = null;
            this.totalShippingCost = null;
            this.shippingLevelDiscountTotal = getShippingLevelDiscountTotal(lineItemContainer);
        // Global-e Order (My Account / Order History)
        } else {
            var geOrder = geOrderMgr.get(lineItemContainer);
            this.subTotal = geOrder.geGetOrderTotal(true);
            this.totalDuties = getTotalDutiesPrice(geOrder);
            this.orderLevelDiscountTotal = geOrder.geGetOrderLevelDiscountTotal();
            this.grandTotal = geOrder.geGetOrderTotal();
            this.discounts = getDiscounts(geOrder, isGlobaleOrder);
            this.discountsHtml = getDiscountsHtml(this.discounts);
            this.totalTax = null;
            this.shippingLevelDiscountTotal = getShippingLevelDiscountTotal(geOrder);
            this.totalShippingCost = geOrder.geGetOrderShippingCost();
            // set gift cards amounts
            var allGiftCardsAmounts = paymentHelpers.getAllGiftCardsAmounts(geOrder);
            this.giftCardsAmounts = allGiftCardsAmounts.giftCardsAmounts;
            this.loyaltyCardsAmounts = allGiftCardsAmounts.loyaltyCardsAmounts;
        }
    } else {
        base.apply(this, Array.prototype.slice.call(arguments));
    }
}

totals.prototype = Object.create(base.prototype);

module.exports = totals;
