'use strict';

/**
 * Calculates and returns Global-e Product.SalePriceBeforeRounding API
 * @param {dw.value.Quantity} qty - Product's quantity
 * @returns {number} - Global-e Product.SalePriceBeforeRounding API
 */
function getSalePriceBeforeRounding(qty) {
    if (this.isBundled()) {
        return 0;
    }
    var salePriceBeforeRounding = this.priceModel.getPriceBeforeRounding(qty);
    return salePriceBeforeRounding.value;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getSalePriceBeforeRounding', {
        value: getSalePriceBeforeRounding
    });
};
