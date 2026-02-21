'use strict';

/**
 * Calculates and returns Global-e Product.Categories API
 * @returns {array} - Global-e Product.Categories API
 */
function getCategories() {
    return [];
}

module.exports = function (object) {
    Object.defineProperty(object, 'getCategories', {
        value: getCategories
    });
};
