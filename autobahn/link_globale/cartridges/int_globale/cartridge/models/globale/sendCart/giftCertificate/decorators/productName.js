'use strict';

/**
 * Calculates and returns Global-e Product.Name API
 * @returns {string} - Global-e Product.Name API
 */
function getProductName() {
    return this.giftCertificateLineItem.lineItemText;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        getProductName: {
            value: getProductName
        }
    });
};
