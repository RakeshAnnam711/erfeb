'use strict';

/**
 * Calculates and returns Global-e Product.isBundled API
 * @returns {boolean} - Global-e Product.isBundled API
 */
function isBundled() {
    return this.productLineItem.isBundledProductLineItem();
}

module.exports = function (object) {
    Object.defineProperties(object, {
        isBundled: {
            value: isBundled
        }
    });
};
