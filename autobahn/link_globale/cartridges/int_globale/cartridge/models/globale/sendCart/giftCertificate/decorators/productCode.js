'use strict';

/**
 * Calculates and returns Global-e Product.getProductCode API
 * @returns {string} - Global-e Product.getProductCode API
 */
function getProductCode() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    return this.giftCertificateLineItem.custom[globaleHelpers.customAttr.giftCertificateLineItem.geGiftCertificateID];
}

module.exports = function (object) {
    Object.defineProperty(object, 'getProductCode', {
        value: getProductCode
    });
};
