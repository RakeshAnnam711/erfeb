'use strict';

var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

/**
 * Calculates and returns Global-e Product.OriginalListPrice API
 * @param {dw.value.Quantity} qty - Product's quantity
 * @returns {number} - Global-e Product.OriginalListPrice API
 */
function getOriginalListPrice(qty) {
    if (this.isBundled()) {
        return 0;
    }
    var originalListPrice = globaleHelpers.getProductListPrice(this.priceModel, true, qty);
    return originalListPrice.value;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getOriginalListPrice', {
        value: getOriginalListPrice
    });
};
