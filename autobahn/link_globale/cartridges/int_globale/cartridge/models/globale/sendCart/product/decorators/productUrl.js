'use strict';

/**
 * Calculates and returns Global-e Product.URL API
 * @returns {string} - Global-e Product.URL API
 */
function getProductUrl() {
    var URLUtils = require('dw/web/URLUtils');
    return URLUtils.abs('Product-Show', 'pid', this.apiProduct.ID).toString();
}

module.exports = function (object) {
    Object.defineProperty(object, 'getProductUrl', {
        value: getProductUrl
    });
};
