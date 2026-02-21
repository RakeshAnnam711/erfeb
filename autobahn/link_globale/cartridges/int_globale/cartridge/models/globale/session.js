/* globals session, request */

'use strict';

/**
 * Retrieves the value of the custom attribute from Current Session
 * @param {string} key - Custom attribute key of Current Session
 * @returns {number|string|boolean|null} - Value stored in Current Session Custom
 */
function get(key) {
    return session.custom[key];
}

/**
 * Retrieves the value of the private custom attribute from Current Session
 * @param {string} key - Custom attribute key of Current Session
 * @returns {number|string|boolean|null} - Value stored in Current Session Privacy
 */
function getPrivacy(key) {
    return session.privacy[key];
}

/**
 * Retrieves Current Session Currency
 * @returns {dw.util.Currency} - Current Session Currency
 */
function getCurrency() {
    return session.currency;
}

/**
 * Retrieves Current Session userName
 * @returns {string} - Current Session userName
 */
function getUserName() {
    return session.userName;
}

/**
 * Set the value for the custom attribute of Current Session
 * @param {string} key - Custom attribute key of Current Session
 * @param {number|string|boolean|null} value - Custom attribute value
 */
function set(key, value) {
    session.custom[key] = value;
}

/**
 * Set the value for the private custom attribute of Current Session
 * @param {string} key - Custom attribute key of Current Session
 * @param {number|string|boolean|null} value - Custom private attribute value
 */
function setPrivacy(key, value) {
    session.privacy[key] = value;
}

/**
 * Sets the default values for all Global-e session custom parameters
 */
function setDefaults() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var locale = require('dw/util/Locale').getLocale(request.locale);
    set('geEnabled', false);
    set('geOperatedCountry', false);
    set('gePriceStrategy', globaleHelpers.consts.priceStrategy.DYNAMIC);
    set('geUseFixedPricesOnly', false);
    set('geCountry', '');
    set('geCountryName', '');
    set('geCurrency', '');
    set('geCulture', '');
    set('geLocale', locale.ID);
    set('geApiVersion', '');
    set('geUseCountryVAT', false);
    set('geDefaultCountryVATRate', null);
    set('geCountryCoefficientIncludeVAT', null);
    if (locale) {
        if (locale.country) {
            set('geCountry', locale.country);
            set('geCountryName', locale.displayCountry);
            set('geCulture', (locale.language + '-' + locale.country));
        } else if (locale.language) {
            set('geCulture', locale.language);
        }
    }
    if (session.currency && session.currency.currencyCode) {
        set('geCurrency', session.currency.currencyCode);
    }
}

/**
 * Returns Session ID
 * @returns {string} - Current Session ID
 */
function getID() {
    return session.sessionID;
}

module.exports = {
    get: get,
    set: set,
    getPrivacy: getPrivacy,
    setPrivacy: setPrivacy,
    setDefaults: setDefaults,
    getCurrency: getCurrency,
    getUserName: getUserName,
    getID: getID
};
