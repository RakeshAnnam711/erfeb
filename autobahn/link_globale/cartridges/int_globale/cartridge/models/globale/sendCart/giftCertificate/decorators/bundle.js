'use strict';

/**
 * Calculates and returns Global-e Product.IsBundle API
 * @returns {boolean} - Global-e Product.IsBundle API
 */
function isBundle() {
    return false;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        isBundle: {
            value: isBundle
        }
    });
};
