'use strict';

/**
 * Calculates and returns Global-e Product.Brand API
 * @returns {Object} - Global-e Product.Brand API
 */
function getBrand() {
    var brand = this.apiProduct.getBrand();
    if (!brand) {
        return null;
    }
    return {
        BrandCode: brand,
        Name: brand
    };
}

module.exports = function (object) {
    Object.defineProperty(object, 'getBrand', {
        value: getBrand
    });
};
