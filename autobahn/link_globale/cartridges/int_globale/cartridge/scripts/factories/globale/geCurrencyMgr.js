'use strict';

/**
 * Returns Global-E object
 * @param {string} key - object key
 * @returns {dw.object.CustomObject|Object} - Global-E object
 */
function getGlobaleObject(key) {
    var Logger = require('dw/system/Logger');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geObjectDataProvider = require('*/cartridge/scripts/factories/globale/geObjectDataProvider');
    var result = null;

    try {
        var provider = geObjectDataProvider.createDataProvider(
            require('*/cartridge/scripts/globale/cache/currencyCacheMgr'),
            globaleHelpers.customObjectKeys.coCurrencies
        );
        result = provider.getGEObject(key);
    } catch (e) {
        Logger.getLogger('GLOBALE').error('geCurrencyMgr: was not able to get Global-E object. Error: ' + e.message);
        throw e;
    }

    return result;
}

/**
 * Checks whether given currencyCode does exist in GLOBALE_CURRENCIES custom object, prevents XSS attacks
 * @param {string} currencyCode - ISO3 Currency Code
 * @returns {boolean} - true if the given currency code does exist, false if not.
 */
function isCurrencyExists(currencyCode) {
    var geObj = getGlobaleObject(currencyCode);
    return geObj !== null;
}

module.exports = {
    getGECurrency: getGlobaleObject,
    isCurrencyExists: isCurrencyExists
};
