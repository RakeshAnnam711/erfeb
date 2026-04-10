'use strict';

/**
 * Returns Global-e session hash
 * @returns {Object} - Global-e session hash object
 */
function getGESessionHashObject() {
    var globaleSession = require('*/cartridge/models/globale/session');
    var hash = {
        geEnabled: globaleSession.get('geEnabled'),
        geOperatedCountry: globaleSession.get('geOperatedCountry'),
        geCountry: globaleSession.get('geCountry'),
        geCurrency: globaleSession.get('geCurrency'),
        geLocale: globaleSession.get('geLocale'),
        geCulture: globaleSession.get('geCulture')
    };

    return hash;
}

/**
 * Returns request hash
 * @returns {Object} - request hash object
 */
function getGERequestHashObject() {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geCountryMgr = require('*/cartridge/scripts/factories/globale/geCountryMgr');

    var httpParameterMap = globaleRequest.get('httpParameterMap');
    var geCookie = (require('*/cartridge/models/globale/cookie')).load();
    var requestCountry = (httpParameterMap.isParameterSubmitted('glCountry') && httpParameterMap.glCountry.value) ||
        (geCookie && geCookie.countryISO) ||
        null;
    var requestCurrency = (httpParameterMap.isParameterSubmitted('glCurrency') && httpParameterMap.glCurrency.value) ||
        (geCookie && geCookie.currencyCode) ||
        null;
    var geCountryConfig = requestCountry !== null ? geCountryMgr.getGECountry(requestCountry) : null;

    var hash = {
        geEnabled: globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geEnabled),
        geOperatedCountry: (geCountryConfig && geCountryConfig.custom.isOperatedByGlobalE),
        geCountry: requestCountry,
        geCurrency: requestCurrency,
        geLocale: globaleRequest.get('locale'),
        geCulture: ((geCookie && geCookie.cultureCode) || null)
    };

    return hash;
}

/**
 * Verifies if Global-e should be reinitialized
 * @param {Object} geCookie - Global-e Cookie
 * @returns {boolean} - True if it is equal and False if not.
 */
function forceGlobaleInit() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();
    var forceInit = true;
    var sessionHash = null;
    var requestHash = null;
    try {
        sessionHash = getGESessionHashObject();
        requestHash = getGERequestHashObject();
        forceInit = JSON.stringify(sessionHash) !== JSON.stringify(requestHash);
    } catch (e) {
        logger.error('OnRequest session hash: {0}, request hash: {1}', sessionHash, requestHash);
        logger.error('OnRequest error: {0}!', e);
    }
    return forceInit;
}

module.exports = {
    forceGlobaleInit: forceGlobaleInit
};
