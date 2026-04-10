'use strict';

/**
 * Calculates and returns Global-e Product.URL API
 * @returns {string} - Global-e Product.URL API
 */
function getProductUrl() {
    return null;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getProductUrl', {
        value: getProductUrl
    });
};
