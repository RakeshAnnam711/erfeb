'use strict';

/**
 * Calculates and returns Global-e Product.OriginalSalePrice API
 * @param {dw.value.Quantity} qty - Product's quantity
 * @returns {number} - Global-e Product.OriginalSalePrice API
 */
function getOriginalSalePrice(qty) {
    if (this.isBundled()) {
        return 0;
    }
    var originalSalePrice = this.priceModel.super.getPrice(qty);
    return originalSalePrice.value;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getOriginalSalePrice', {
        value: getOriginalSalePrice
    });
};
