'use strict';

/**
 * Retrieves Global-e Currency FX RateData
 * @returns {string} - Global-e FX Rate Data
 */
function getCurrencyRateData() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleSession = require('*/cartridge/models/globale/session');
    var geCurrencyRateMgr = require('*/cartridge/scripts/factories/globale/geCurrencyRateMgr');

    var currencyRateKey = globaleHelpers.getMerchantBaseCurrencyCode() + '_' + globaleSession.get('geCurrency');
    var currencyRateCo = geCurrencyRateMgr.getGECurrencyRate(currencyRateKey);

    return ((currencyRateCo && currencyRateCo.custom.rateData) || null);
}

module.exports = function (object) {
    Object.defineProperty(object, 'getCurrencyRateData', {
        value: getCurrencyRateData
    });
};
