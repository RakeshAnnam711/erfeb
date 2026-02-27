'use strict';

var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

/**
 * Calculates and returns Global-e Product.ListPrice API
 * @param {dw.value.Quantity} qty - Product's quantity
 * @returns {number} - Global-e Product.ListPrice API
 */
function getListPrice(qty) {
    if (this.isBundled()) {
        return 0;
    }
    var listPrice = globaleHelpers.getProductListPrice(this.priceModel, false, qty);
    return listPrice.value;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getListPrice', {
        value: getListPrice
    });
};
