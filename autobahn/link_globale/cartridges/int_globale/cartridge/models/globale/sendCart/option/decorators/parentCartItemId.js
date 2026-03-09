'use strict';

/**
 * Calculates and returns Global-e Product.ParentCartItemId API
 * @returns {string|null} - Global-e Product.ParentCartItemId API
 */
function getParentCartItemId() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var parentProduct = this.productLineItem.getParent();
    if (!empty(parentProduct.custom[globaleHelpers.customAttr.productLineItem.geCartItemId])) {
        return parentProduct.custom[globaleHelpers.customAttr.productLineItem.geCartItemId];
    }
    return this.productLineItem.getParent().getPosition();
}

module.exports = function (object) {
    Object.defineProperties(object, {
        getParentCartItemId: {
            value: getParentCartItemId
        }
    });
};
