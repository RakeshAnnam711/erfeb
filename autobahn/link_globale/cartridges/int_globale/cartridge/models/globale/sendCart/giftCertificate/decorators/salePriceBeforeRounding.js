'use strict';

/**
 * Calculates and returns Global-e Product.SalePriceBeforeRounding API
 * @returns {number} - Global-e Product.SalePriceBeforeRounding API
 */
function getSalePriceBeforeRounding() {
    var Money = require('dw/value/Money');
    var globaleSession = require('*/cartridge/models/globale/session');
    var globalePrice = require('*/cartridge/scripts/factories/globale/price');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var currencyCode = globaleSession.getCurrency().currencyCode;

    var gePrice = this.giftCertificateLineItem.custom[globaleHelpers.customAttr.giftCertificateLineItem.gePrice] || this.giftCertificateLineItem.price.valueOrNull;

    var price = globalePrice(new Money(gePrice, currencyCode), null, 1, true, null, null, true, this.giftCertificateLineItem);
    return price.valueOrNull;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getSalePriceBeforeRounding', {
        value: getSalePriceBeforeRounding
    });
};
