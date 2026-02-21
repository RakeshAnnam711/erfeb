'use strict';

/**
 * Calculates and returns Global-e Product.OriginalSalePrice API
 * @returns {number} - Global-e Product.OriginalSalePrice API
 */
function getOriginalSalePrice() {
    return this.priceModel.super.value;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getOriginalSalePrice', {
        value: getOriginalSalePrice
    });
};
