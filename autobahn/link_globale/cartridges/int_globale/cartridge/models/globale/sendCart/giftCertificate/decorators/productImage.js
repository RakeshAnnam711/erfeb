'use strict';

/**
 * Calculates and returns Global-e Product Image URL API
 * @returns {string|null} - Global-e Product Image URL API
 */
function getProductImageUrl() {
    return null;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getProductImageUrl', {
        value: getProductImageUrl
    });
};
