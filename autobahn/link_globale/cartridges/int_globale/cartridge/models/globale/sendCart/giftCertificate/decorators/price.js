'use strict';

/**
 * Calculates and returns Global-e Product.SalePrice API
 * @returns {number} - Global-e Product.SalePrice API
 */
function getSalePrice() {
    return this.priceModel.value;
}

/**
 * Calculates and returns Global-e Product.SalePriceReason API
 * @returns {string} - Global-e Product.SalePriceReason API
 */
function getSalePriceReason() {
    return '';
}

module.exports = function (object) {
    var Money = require('dw/value/Money');
    var globaleSession = require('*/cartridge/models/globale/session');
    var globalePrice = require('*/cartridge/scripts/factories/globale/price');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var currencyCode = globaleSession.getCurrency().currencyCode;
    Object.defineProperties(object, {
        priceModel: {
            enumerable: true,
            get: function () {
                var gePrice = this.giftCertificateLineItem.custom[globaleHelpers.customAttr.giftCertificateLineItem.gePrice] || this.giftCertificateLineItem.price.valueOrNull;
                var price = globalePrice(new Money(gePrice, currencyCode), this.giftCertificateLineItem.getGiftCertificateID(), 1, false, null, null, true, true, this.giftCertificateLineItem);
                return price;
            }
        },
        getSalePrice: {
            value: getSalePrice
        },
        getSalePriceReason: {
            value: getSalePriceReason
        }
    });
};
