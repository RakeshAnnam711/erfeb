'use strict';

/**
 * Calculates and returns Global-e Product.ListPrice API
 * @returns {number} - Global-e Product.ListPrice API
 */
function getListPrice() {
    return this.optionModel.getPrice(this.optionValue).value;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getListPrice', {
        value: getListPrice
    });
};
