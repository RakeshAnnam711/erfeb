'use strict';

/**
 * Calculates and returns Global-e Product.CartItemOptionId API
 * @returns {number} - Global-e Product.CartItemOptionId API
 */
function getCartItemOptionId() {
    return this.productLineItem.getOptionValueID();
}

module.exports = function (object) {
    Object.defineProperties(object, {
        getCartItemOptionId: {
            value: getCartItemOptionId
        }
    });
};
