'use strict';

/**
 * Calculates and returns Global-e Product.OriginalListPrice API
 * @returns {number} - Global-e Product.OriginalListPrice API
 */
function getOriginalListPrice() {
    return this.priceModel.super.value;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getOriginalListPrice', {
        value: getOriginalListPrice
    });
};
