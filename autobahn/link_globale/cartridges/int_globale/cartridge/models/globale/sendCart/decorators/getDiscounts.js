'use strict';

/**
 * Calculates price adjustment VAT Rate
 * @param {dw.order.PriceAdjustment} pa - SFCC PriceAdjustment object
 * @param {dw.util.HashMap} pliVatRateMap - PLI VAT Rate Map
 * @returns {number} - price adjustment VAT Rate
 */
function calculatePAVatRate(pa, pliVatRateMap) {
    var paVatRate = 0;

    var proratedPlisIter = pa.proratedPrices.keySet().iterator();
    var currentPli = null;
    var currentPliMappedValue = null;
    while (proratedPlisIter.hasNext()) {
        currentPli = proratedPlisIter.next();
        currentPliMappedValue = pliVatRateMap.get(currentPli);
        if (currentPliMappedValue !== null) {
            paVatRate += currentPliMappedValue;
        }
    }

    return paVatRate;
}

/**
 * Calculates and returns Global-e Discount API
 * @param {dw.order.PriceAdjustment} priceAdjustment - SFCC PriceAdjustment object
 * @param {number} vatRate - Global-e VAT Rate
 * @param {number} localVatRate - Global-e Local VAT Rate
 * @param {dw.order.ProductLineItem|undefined} productLineItem - SFCC Product Line Item. If undefined - Order level Discount
 * @param {Array} cartItemsToExclude - Cart Items To Exclude
 * @returns {Object} - Global-e Discount API
 */
function getDiscount(priceAdjustment, vatRate, localVatRate, productLineItem, cartItemsToExclude) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var discount = {
        OriginalDiscountValue: null, // decimal
        VATRate: vatRate, // decimal,
        LocalVATRate: localVatRate, // decimal
        DiscountSource: 1, // Int64
        DiscountValue: -priceAdjustment.price.value, // decimal
        Name: null,
        Description: null,
        CouponCode: null,
        ProductCartItemId: null,
        DiscountCode: null,
        LoyaltyVoucherCode: null,
        DiscountType: 1, // Int64
        CalculationMode: 1, // Int64
        CartItemsToExclude: cartItemsToExclude || []
    };

    if (productLineItem) {
        discount.ProductCartItemId = productLineItem.custom[globaleHelpers.customAttr.productLineItem.geCartItemId];
    }
    if (priceAdjustment.promotion !== null) {
        discount.OriginalDiscountValue = -priceAdjustment.custom[globaleHelpers.customAttr.priceAdjustment.geOriginalPriceAdjustmentPrice];
        discount.DiscountCode = priceAdjustment.promotion.ID;
        discount.Name = priceAdjustment.promotion ? priceAdjustment.promotion.ID : '';
        /**
         * It is possible to redeem Loyalty Points as Basket discount on SFCC side.
         * The Promotion should be configured accordingly (custom attribute 'geLoyaltyPromotion').
         */
        if (priceAdjustment.promotion.custom[globaleHelpers.customAttr.promotion.geLoyaltyPromotion] === true) {
            discount.DiscountType = 3;
            discount.CalculationMode = 2;
        }
        if (priceAdjustment.basedOnCoupon && priceAdjustment.couponLineItem !== null) {
            discount.CouponCode = priceAdjustment.couponLineItem.couponCode;
            if (priceAdjustment.promotion.custom[globaleHelpers.customAttr.promotion.geLoyaltyPromotion] === true) {
                discount.LoyaltyVoucherCode = priceAdjustment.couponLineItem.couponCode;
            }
        }
    }
    return discount;
}

/**
 * Calculates and returns Global-e SendCart.Discounts API
 * @returns {Object} - Global-e SendCart.Discounts API
 */
function getDiscounts() {
    var HashMap = require('dw/util/HashMap');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var numbers = require('*/cartridge/scripts/util/globale/numbers');

    var discounts = [];
    var pliVatRateMap = new HashMap();
    var isTaxationBasedOnAdjustedPrice = false;

    // Product Line Item level discounts
    collections.forEach(this.basket.allProductLineItems, function (productLineItem) {
        var vatRateDst = productLineItem.custom[globaleHelpers.customAttr.productLineItem.geVatRate];
        var vatRateLocal = numbers.round((productLineItem.taxRate * 100), 2);

        pliVatRateMap.put(productLineItem, ((productLineItem.adjustedPrice.value / this.basket.getAdjustedMerchandizeTotalPrice(false).value) * vatRateDst));
        collections.forEach(productLineItem.priceAdjustments, function (priceAdjustment) {
            discounts.push(getDiscount(priceAdjustment, vatRateDst, vatRateLocal, productLineItem));

            if (isTaxationBasedOnAdjustedPrice === false) {
                isTaxationBasedOnAdjustedPrice = priceAdjustment.price.value !== 0 && priceAdjustment.taxBasis.value === 0;
            }
        }, this);
    }, this);

    // Order level discounts
    collections.forEach(this.basket.priceAdjustments, function (priceAdjustment) {
        var excludedCartItemIds = [];
        if (priceAdjustment.proratedPrices.size() > 0) {
            collections.forEach(this.basket.allProductLineItems, function (productLineItem) {
                if (!priceAdjustment.proratedPrices.containsKey(productLineItem)) {
                    excludedCartItemIds.push(productLineItem.position.toString());
                }
            });
        }

        var vatRate = numbers.round(calculatePAVatRate(priceAdjustment, pliVatRateMap), 2);
        var localVatRate = (priceAdjustment.tax.value !== 0 ? numbers.round((priceAdjustment.taxRate * 100), 2) : 0);

        discounts.push(getDiscount(priceAdjustment, vatRate, localVatRate, null, excludedCartItemIds));

        if (isTaxationBasedOnAdjustedPrice === false) {
            isTaxationBasedOnAdjustedPrice = priceAdjustment.price.value !== 0 && priceAdjustment.taxBasis.value === 0;
        }
    }, this);

    // set discount taxation mode
    this.isTaxationBasedOnAdjustedPrice = isTaxationBasedOnAdjustedPrice;

    return discounts;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        getDiscounts: {
            value: getDiscounts
        }
    });
};
