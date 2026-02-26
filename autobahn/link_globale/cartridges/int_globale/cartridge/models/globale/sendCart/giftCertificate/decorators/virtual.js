'use strict';

/**
 * Calculates and returns Global-e Product.IsVirtual API
 * @returns {boolean} - Global-e Product.IsVirtual API
 */
function isVirtual() {
    return true;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        isVirtual: {
            value: isVirtual
        }
    });
};
