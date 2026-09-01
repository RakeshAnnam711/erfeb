'use strict';

/**
 * Represents a GlobaleCookie.
 * @constructor
 * @param {string} countryCode - Country Code
 * @param {string} cultureCode - Culture Code
 * @param {string} currencyCode - Currency Code
 * @param {string} apiVersion - API Version
 */
function GlobaleCookie(countryCode, cultureCode, currencyCode, apiVersion) {
    var Encoding = require('dw/crypto/Encoding');

    this.countryISO = countryCode;
    this.cultureCode = cultureCode;
    this.currencyCode = currencyCode;
    this.apiVersion = apiVersion;

    this.toString = function () {
        return Encoding.toURI(JSON.stringify({
            countryISO: this.countryISO,
            cultureCode: this.cultureCode,
            currencyCode: this.currencyCode,
            apiVersion: this.apiVersion
        }));
    };
}

/**
 * Retrieves Global-e Cookies
 * @param {string} countryCode - Country Code
 * @param {string} currencyCode - Currency Code
 * @returns {Object|null} - Global-e Cookie JSON Object or null
 */
function load(countryCode, currencyCode) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleRequest = require('*/cartridge/models/globale/request');

    var geCookie = null;
    var httpCookies = globaleRequest.get('httpCookies');
    var cookieName = globaleHelpers.consts.geCookieName;

    if (countryCode || currencyCode) {
        geCookie = new GlobaleCookie(countryCode || '', '', currencyCode || '', '');
    } else if (cookieName && (cookieName in httpCookies) && httpCookies[cookieName]) {
        var geCookieObj = JSON.parse(decodeURIComponent(httpCookies[cookieName].getValue()));
        if (geCookieObj) {
            if (['countryISO', 'currencyCode', 'cultureCode', 'apiVersion'].some(function (prop) {
                return (!(prop in geCookieObj) || !geCookieObj[prop] || geCookieObj[prop] === 'null');
            })) {
                geCookie = null;
            } else {
                geCookie = new GlobaleCookie(geCookieObj.countryISO, geCookieObj.cultureCode, geCookieObj.currencyCode, geCookieObj.apiVersion);
            }
        }
    }
    return geCookie;
}

/**
 * Saves Global-e parameters in cookie
 * @param {string} countryCode - Country Code
 * @param {string} cultureCode - Culture Code
 * @param {string} currencyCode - Currency Code
 * @param {string} apiVersion - Global-e API Version
 * @returns {Object} - Global-e Cookie JSON Object
 */
function save(countryCode, cultureCode, currencyCode, apiVersion) {
    var Cookie = require('dw/web/Cookie');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleResponse = require('*/cartridge/models/globale/response');

    var geCookie = new GlobaleCookie(countryCode, cultureCode, currencyCode, apiVersion);

    var geSfccCookie = new Cookie(globaleHelpers.consts.geCookieName, geCookie.toString());
    geSfccCookie.setDomain(globaleHelpers.getCookieDomain());
    geSfccCookie.setPath('/');
    geSfccCookie.setMaxAge(globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geCookieLifetime));
    geSfccCookie.setSecure(true);
    globaleResponse.addHttpCookie(geSfccCookie);

    return geCookie;
}

module.exports = {
    load: load,
    save: save
};
