'use strict';

/**
 * Calculates and returns Global-e Product.IsVirtual API
 * @returns {boolean} - Global-e Product.IsVirtual API
 */
function isVirtual() {
    // By default, we consider product options to be virtual.
    // If the product option is a physical product, then custom logic should be added here.
    return true;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        isVirtual: {
            value: isVirtual
        }
    });
};
