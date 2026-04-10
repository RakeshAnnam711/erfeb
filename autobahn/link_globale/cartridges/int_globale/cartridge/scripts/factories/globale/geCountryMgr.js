'use strict';

/**
 * Returns Global-E Country object
 * @throws {Error}
 * @param {string} key - Country key
 * @returns {dw.object.CustomObject|Object} - Country object
 */
function getGECountry(key) {
    var Logger = require('dw/system/Logger');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geObjectDataProvider = require('*/cartridge/scripts/factories/globale/geObjectDataProvider');
    var result = null;

    try {
        var provider = geObjectDataProvider.createDataProvider(
            require('*/cartridge/scripts/globale/cache/countriesCacheMgr'),
            globaleHelpers.customObjectKeys.coCountries
        );
        result = provider.getGEObject(key);
    } catch (e) {
        Logger.getLogger('GLOBALE').error('geCountryMgr: was not able to get Global-E object. Error: ' + e.message);
        throw e;
    }

    return result;
}

/**
 * Returns Global-E Country VAT Rate
 * @param {string} countryCode - Country Code
 * @returns {string} - Country VAT Rate
 */
function getCountryVATRate(countryCode) {
    var geCountry = countryCode ? getGECountry(countryCode) : null;
    var result = null;

    try {
        var defaultVATRateType = geCountry.custom.defaultVATRateType && JSON.parse(geCountry.custom.defaultVATRateType);
        if (defaultVATRateType && ('Rate' in defaultVATRateType) && defaultVATRateType.Rate) {
            result = defaultVATRateType.Rate;
        }
    } catch (e) {
        result = null;
    }

    return result;
}

/**
 * Returns Global-E Use Country VAT
 * @param {string} countryCode - Country Code
 * @returns {string} - Use Country VAT
 */
function getUseCountryVAT(countryCode) {
    var geCountry = countryCode ? getGECountry(countryCode) : null;
    return geCountry ? geCountry.custom.useCountryVAT : null;
}

/**
 * Returns Global-E Country Site URL
 * @param {string} countryCode - Country Code
 * @returns {string} - Country Site URL
 */
function getCountrySiteURL(countryCode) {
    var geCountry = countryCode ? getGECountry(countryCode) : null;
    return geCountry ? geCountry.custom.siteUrl : null;
}

/**
 * Returns Global-E Country default currency code
 * @param {string} countryCode - Country Code
 * @returns {string} - Country default currency code
 */
function getDefaultCurrencyCode(countryCode) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geCurrencyMgr = require('*/cartridge/scripts/factories/globale/geCurrencyMgr');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');

    var geCountry = getGECountry(countryCode);
    var defaultCurrencyCode = geCountry.custom.defaultCurrencyCode;

    // ignore custom mappings for fixed price countries
    if (geCountry.custom.supportsFixedPrices) {
        return defaultCurrencyCode;
    }

    // get custom mapping
    var sfccDynamicCountryCurrencyMapping = geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccDynamicCountryCurrencyMapping, {}, 'json');
    if (
        (countryCode in sfccDynamicCountryCurrencyMapping) &&
        sfccDynamicCountryCurrencyMapping[countryCode] &&
        geCurrencyMgr.isCurrencyExists(sfccDynamicCountryCurrencyMapping[countryCode])
    ) {
        defaultCurrencyCode = sfccDynamicCountryCurrencyMapping[countryCode];
    }

    return defaultCurrencyCode;
}

/**
 * Checks whether given countryCode does exist in GLOBALE_COUNTRIES custom object, prevents XSS attacks
 * @param {string} countryCode - ISO2 Country Code
 * @returns {boolean} - true if the given country code does exist, false if not.
 */
function isCountryExists(countryCode) {
    var result = false;
    try {
        var geObj = getGECountry(countryCode);
        result = geObj !== null;
    } catch (e) {
        // no need to handle error
    }

    return result;
}

/**
 * Returns Global-E ISO3 Country Code
 * @param {string} countryCode - Country Code (ISO2)
 * @returns {string} - ISO3 Country Code
 */
function getISO3CountryCode(countryCode) {
    var geCountry = countryCode ? getGECountry(countryCode) : null;
    return geCountry ? geCountry.custom.countryCode3 : null;
}

/**
 * Returns VATExemptionDisabled value
 * @param {string} countryCode - ISO2 Country Code
 * @returns {boolean} - VATExemptionDisabled value.
 */
function getVATExemptionDisabled(countryCode) {
    var geCountry = countryCode ? getGECountry(countryCode) : null;
    return geCountry ? geCountry.custom.vatExemptionDisabled : true;
}

/**
 * Returns allowed country currencies
 * @param {string} countryCode - ISO2 Country Code
 * @returns {Array} - currency list
 */
function getAllowedCountryCurrencies(countryCode) {
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var allowedCurrencies = [];
    try {
        var allowedCurrenciesConfig = geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccAllowedCurrencies, {}, 'json');
        allowedCurrencies = ('default' in allowedCurrenciesConfig) ? allowedCurrenciesConfig.default : ['GBP', 'EUR', 'USD'];
        allowedCurrencies = (countryCode in allowedCurrenciesConfig) ? allowedCurrenciesConfig[countryCode] : allowedCurrencies;

        var defaultCurrency = getDefaultCurrencyCode(countryCode);
        if (allowedCurrencies.indexOf(defaultCurrency) === -1) {
            allowedCurrencies.push(defaultCurrency);
        }
    } catch (e) {
        // skip exception handling
    }

    return allowedCurrencies;
}

module.exports = {
    getGECountry: getGECountry,
    getCountryVATRate: getCountryVATRate,
    getUseCountryVAT: getUseCountryVAT,
    getCountrySiteURL: getCountrySiteURL,
    isCountryExists: isCountryExists,
    getDefaultCurrencyCode: getDefaultCurrencyCode,
    getISO3CountryCode: getISO3CountryCode,
    getVATExemptionDisabled: getVATExemptionDisabled,
    getAllowedCountryCurrencies: getAllowedCountryCurrencies
};
