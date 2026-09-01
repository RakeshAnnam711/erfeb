'use strict';

/**
 * Calculates and returns Global-e Product.IsVirtual API
 * @returns {boolean} - Global-e Product.IsVirtual API
 */
function isVirtual() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var virtual = false;
    if (this.apiProduct.custom[globaleHelpers.customAttr.product.geIsGiftCard] === true) {
        virtual = true;
    }
    return virtual;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        isVirtual: {
            value: isVirtual
        }
    });
};
