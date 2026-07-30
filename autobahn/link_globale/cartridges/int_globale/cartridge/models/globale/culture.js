'use strict';

/**
 * Retrieves Global-e Culture Code
 * @param {string} countryCode - Country Code
 * @param {string} localeID - Locale ID
 * @returns {string} - Global-e Culture Code
 */
function getGlobaleCultureCode(countryCode, localeID) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geCultureMgr = require('*/cartridge/scripts/factories/globale/geCultureMgr');
    var cultureCode = null;

    // get culture code by locale id
    cultureCode = globaleHelpers.getPreferenceMapVal(globaleHelpers.platformSettings.sfccCultureMapping, localeID);

    // get culture code by country code
    if (!cultureCode) {
        cultureCode = globaleHelpers.getPreferenceMapVal(globaleHelpers.platformSettings.sfccCultureMapping, countryCode);
    }

    // use Global-e country culture as a fallaback
    if (!cultureCode) {
        var globaleCultureObj = geCultureMgr.getGECulture(countryCode);
        cultureCode = (globaleCultureObj !== null) ? globaleCultureObj.getCustom().culture : null;
    }

    // default culture code
    if (!cultureCode) {
        cultureCode = 'en';
    }

    return cultureCode;
}

/**
 * Returns Global-e Culture Code
 * @param {string} countryCode - Country Code
 * @param {string} localeID - Locale ID
 * @returns {string|null} - Global-e checkout Culture Code
 */
function getGlobaleCheckoutCultureCode(countryCode, localeID) {
    var Locale = require('dw/util/Locale');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var cultureCode = null;

    // get culture code by locale id
    cultureCode = globaleHelpers.getPreferenceMapVal(globaleHelpers.platformSettings.sfccCheckoutCultureMapping, localeID);

    // get culture code by country code
    if (!cultureCode) {
        cultureCode = globaleHelpers.getPreferenceMapVal(globaleHelpers.platformSettings.sfccCheckoutCultureMapping, countryCode);
    }

    // use locale language as a fallback
    if (!cultureCode) {
        var locale = Locale.getLocale(localeID);
        cultureCode = (locale && locale.language) ? locale.language : null;
    }

    // default culture code
    if (!cultureCode) {
        cultureCode = 'en';
    }

    return cultureCode;
}

module.exports = {
    getGlobaleCultureCode: getGlobaleCultureCode,
    getGlobaleCheckoutCultureCode: getGlobaleCheckoutCultureCode
};
