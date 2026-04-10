'use strict';

/**
 * Calculates and returns Global-e Product.ParentCartItemId API
 * @returns {string|null} - Global-e Product.ParentCartItemId API
 */
function getParentCartItemId() {
    return (this.productLineItem.parent ? String(this.productLineItem.parent.position) : null);
}

module.exports = function (object) {
    Object.defineProperties(object, {
        getParentCartItemId: {
            value: getParentCartItemId
        }
    });
};
