/* eslint-disable no-param-reassign */

'use strict';

/**
 * Preserves original prices for Basket, product line items and its price adjustments.
 */
function gePreserveOriginalPrices() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var collections = require('*/cartridge/scripts/util/globale/collections');

    collections.forEach(this.getAllProductLineItems(), function (productLineItem) {
        productLineItem.custom[globaleHelpers.customAttr.productLineItem.geOriginalPriceBookTotalPrice] = productLineItem.price.value;
        collections.forEach(productLineItem.priceAdjustments, function (priceAdjustment) {
            priceAdjustment.custom[globaleHelpers.customAttr.priceAdjustment.geOriginalPriceAdjustmentPrice] = priceAdjustment.price.value;
        }, this);
    }, this);

    collections.forEach(this.priceAdjustments, function (priceAdjustment) {
        priceAdjustment.custom[globaleHelpers.customAttr.priceAdjustment.geOriginalPriceAdjustmentPrice] = priceAdjustment.price.value;
    }, this);
}

module.exports = function (object) {
    Object.defineProperty(object, 'gePreserveOriginalPrices', {
        value: gePreserveOriginalPrices
    });
};
