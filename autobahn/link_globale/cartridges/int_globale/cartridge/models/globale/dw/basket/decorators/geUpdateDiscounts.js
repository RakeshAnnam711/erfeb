/* eslint-disable no-param-reassign */

'use strict';

/**
 * Returns initial proration data
 * @param {Object} pli - Product Line Item
 * @returns {Array} - Initial proration data
 */
function getPliInitialProrationData(pli) {
    var ArrayList = require('dw/util/ArrayList');
    var pliProrationData = { items: new ArrayList() };

    for (var i = 0; i < pli.quantityValue; i++) {
        pliProrationData.items.add({ basePrice: pli.basePrice, adjustments: [], proratedPrice: pli.basePrice });
    }

    return pliProrationData;
}

/**
 * Updates price adjustments
 * @param {Object} originalDiscounts - Original Discounts
 */
function geUpdateDiscounts(originalDiscounts) {
    var LinkedHashMap = require('dw/util/LinkedHashMap');
    var PropertyComparator = require('dw/util/PropertyComparator');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var geProductPriceAdjustment = require('*/cartridge/scripts/factories/globale/productPriceAdjustment');
    var geOrderPriceAdjustment = require('*/cartridge/scripts/factories/globale/orderPriceAdjustment');
    var geShippingPriceAdjustment = require('*/cartridge/scripts/factories/globale/shippingPriceAdjustment');
    var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
    var globaleSession = require('*/cartridge/models/globale/session');

    var basket = this;

    // pre-processing (required for some price adjustments, like "Total Fixed Price")
    collections.forEach(basket.allProductLineItems, function (productLineItem) {
        originalDiscounts.productLineItems[productLineItem.UUID].gePrice = productLineItem.price;
        originalDiscounts.productLineItems[productLineItem.UUID].geBasePrice = productLineItem.basePrice;
    });

    // product discounts
    var appliedDiscountsTotal = 0;
    collections.forEach(basket.allProductLineItems, function (productLineItem) {
        var pliAppliedDiscountsTotal = 0;
        var pliProrationData = getPliInitialProrationData(productLineItem);

        collections.forEach(productLineItem.priceAdjustments, function (priceAdjustment) {
            var productPriceAdjustment = geProductPriceAdjustment(productLineItem, priceAdjustment, originalDiscounts, pliProrationData);
            productPriceAdjustment.pliAppliedDiscountsTotal = pliAppliedDiscountsTotal;
            if (productPriceAdjustment.isApplicable()) {
                var discount = productPriceAdjustment.getPrice();
                if (discount !== null && discount.value <= 0) {
                    // check if discount value is not bigger then max applicable discount value
                    var pliMaxApplicableDiscountValue = (productLineItem.basePrice.value * productLineItem.quantityValue) - pliAppliedDiscountsTotal;
                    if ((discount.value * (-1)) > pliMaxApplicableDiscountValue) {
                        discount = globaleMoney(pliMaxApplicableDiscountValue * (-1), globaleSession.get('geCurrency'));
                    }

                    priceAdjustment.setPriceValue(discount.value);
                    appliedDiscountsTotal -= discount.value;
                    pliAppliedDiscountsTotal -= discount.value;
                } else {
                    basket.removePriceAdjustment(priceAdjustment);
                }
            } else {
                basket.removePriceAdjustment(priceAdjustment);
            }

            pliProrationData.items.sort(new PropertyComparator('proratedPrice', false));
        });
    });
    basket.updateTotals();

    // order discounts
    var proratedPliDiscountedPricesHashMap = new LinkedHashMap();
    collections.forEach(basket.priceAdjustments, function (priceAdjustment) {
        var orderPriceAdjustment = geOrderPriceAdjustment(basket, priceAdjustment, originalDiscounts, proratedPliDiscountedPricesHashMap);
        orderPriceAdjustment.appliedDiscountsTotal = appliedDiscountsTotal;
        if (orderPriceAdjustment.isApplicable()) {
            var discount = orderPriceAdjustment.getPrice();
            if (discount !== null && discount.value <= 0) {
                // check if discount value is not bigger then max applicable discount value
                var maxApplicableDiscountValue = basket.merchandizeTotalPrice.value - appliedDiscountsTotal;
                if ((discount.value * (-1)) > maxApplicableDiscountValue) {
                    discount = globaleMoney(maxApplicableDiscountValue * (-1), globaleSession.get('geCurrency'));
                }

                priceAdjustment.setPriceValue(discount.value);
                appliedDiscountsTotal -= discount.value;
            } else {
                basket.removePriceAdjustment(priceAdjustment);
            }
        } else {
            basket.removePriceAdjustment(priceAdjustment);
        }
    });
    basket.updateTotals();

    // shipping discounts
    collections.forEach(basket.allShippingPriceAdjustments, function (priceAdjustment) {
        var shippingPriceAdjustment = geShippingPriceAdjustment(basket, priceAdjustment);
        if (!shippingPriceAdjustment.isApplicable()) {
            basket.removePriceAdjustment(priceAdjustment);
        }
    });
    basket.updateTotals();
    if (basket.adjustedShippingTotalPrice.value > 0) {
        basket.geSetZeroShippingPrice();
    }
    basket.updateTotals();
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geUpdateDiscounts: {
            value: geUpdateDiscounts
        }
    });
};
