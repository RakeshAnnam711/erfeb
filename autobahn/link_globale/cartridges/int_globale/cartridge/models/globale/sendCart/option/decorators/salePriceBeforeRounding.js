'use strict';

/**
 * Calculates and returns Global-e Product.SalePriceBeforeRounding API
 * @returns {number} - Global-e Product.SalePriceBeforeRounding API
 */
function getSalePriceBeforeRounding() {
    return this.optionModel.getPriceBeforeRounding(this.optionValue).value;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getSalePriceBeforeRounding', {
        value: getSalePriceBeforeRounding
    });
};
