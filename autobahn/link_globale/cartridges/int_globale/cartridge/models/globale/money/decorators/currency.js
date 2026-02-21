'use strict';

module.exports = function (object, currencyCode) {
    var geCurrencyMgr = require('*/cartridge/scripts/factories/globale/geCurrencyMgr');
    Object.defineProperties(object, {
        currency: {
            enumerable: true,
            value: geCurrencyMgr.getGECurrency(currencyCode)
        },
        getCurrencyCode: {
            value: function () {
                return (((this.valueOrNull !== null) && currencyCode) || 'N/A');
            }
        },
        currencyCode: {
            enumerable: true,
            get: function () {
                return this.getCurrencyCode();
            }
        },
        isOfSameCurrency: {
            value: function (money) {
                return (money && (money.currencyCode === this.currencyCode));
            }
        }
    });
};
