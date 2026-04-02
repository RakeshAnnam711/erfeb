'use strict';

var currencyRateCache = {};

/**
 * Retrieves Global-e Currency FX Rate, RateData
 * @returns {number} - Global-e FX Rate
 */
function getCurrencyRate() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleSession = require('*/cartridge/models/globale/session');
    var geCurrencyRateMgr = require('*/cartridge/scripts/factories/globale/geCurrencyRateMgr');

    var currencyRateKey = globaleHelpers.getMerchantBaseCurrencyCode() + '_' + globaleSession.get('geCurrency');
    if (!(currencyRateKey in currencyRateCache)) {
        var currencyRateCo = geCurrencyRateMgr.getGECurrencyRate(currencyRateKey);
        currencyRateCache[currencyRateKey] = ((currencyRateCo && currencyRateCo.custom.rate) || null);
    }

    return currencyRateCache[currencyRateKey];
}

module.exports = function (object) {
    Object.defineProperties(object, {
        currencyRate: {
            enumerable: true,
            value: getCurrencyRate()
        }
    });
};
