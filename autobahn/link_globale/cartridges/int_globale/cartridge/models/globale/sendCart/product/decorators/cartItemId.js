'use strict';

/**
 * Calculates and returns Global-e Product.CartItemId API
 * @returns {string} - Global-e Product.CartItemId API
 */
function getCartItemId() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    return (this.productLineItem.custom[globaleHelpers.customAttr.productLineItem.geCartItemId] || null);
}

module.exports = function (object) {
    Object.defineProperties(object, {
        getCartItemId: {
            value: getCartItemId
        }
    });
};
