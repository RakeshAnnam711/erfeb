'use strict';

/**
 * Calculates and returns Global-e Product.ListPrice API
 * @returns {number} - Global-e Product.ListPrice API
 */
function getListPrice() {
    return this.priceModel.valueOrNull;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getListPrice', {
        value: getListPrice
    });
};
