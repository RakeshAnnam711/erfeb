'use strict';

/**
 * Calculates and returns Global-e Product.OriginalListPrice API
 * @returns {number} - Global-e Product.OriginalListPrice API
 */
function getOriginalListPrice() {
    return this.optionModel.getOriginalPrice(this.optionValue).value;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getOriginalListPrice', {
        value: getOriginalListPrice
    });
};
