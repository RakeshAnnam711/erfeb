/* globals session, request */
/* eslint no-use-before-define: "off" */

'use strict';

/**
 * Returns OCAPI version
 * @returns {string} - OCAPI version
 */
function getOCAPIVersion() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    return globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geOCAPIVersion);
}

/**
 * Returns OCAPI client id
 * @returns {string} - OCAPI client id
 */
function getOCAPIClientId() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    return globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geOCAPIClientId);
}

/**
 * Returns OCAPI Shop Url
 * @param {string} resource - resource
 * @returns {string} - OCAPI Base Shop Url
 */
function getOCAPIShopUrl(resource) {
    var Site = require('dw/system/Site');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var httpHost = require('*/cartridge/models/globale/request').get('httpHost');
    var ocapiDomain = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geOCAPIDomain) || httpHost;
    var url = 'https://' + ocapiDomain + '/s/Sites-' + Site.current.ID + '-Site/dw/shop/' + this.getOCAPIVersion() + resource;

    return url;
}

/**
 * Checks if SCAPI is enabled
 * @return {boolean} Returns true if SCAPI is enabled, false otherwise.
 */
function isSCAPIEnabled() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    return getCAPIType() === globaleHelpers.consts.capi.SCAPI_TYPE;
}

/**
 * Returns SCAPI Short Code
 * @returns {string} - SCAPI Short Code
 */
function getSCAPIShortCode() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    return globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geSCAPIShortCode);
}

/**
 * Returns SCAPI version
 * @returns {string} - SCAPI version
 */
function getSCAPIVersion() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    return globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geSCAPIVersion);
}

/**
 * Returns SCAPI Organization ID
 * @returns {string} - SCAPI Organization ID
 */
function getSCAPIOrganizationId() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    return globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geSCAPIOrganizationId);
}

/**
 * Returns SCAPI Client ID
 * @returns {string} - SCAPI Client ID
 */
function getSCAPIClientId() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    return globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geSCAPIClientId);
}

/**
 * Returns SCAPI Client Secret
 * @returns {string} - SCAPI Client Secret
 */
function getSCAPIClientSecret() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    return globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geSCAPIClientSecret);
}

/**
 * Returns SCAPI Redirect URI
 * @returns {string} - SCAPI Redirect URI
 */
function getSCAPIRedirectURI() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    return globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geSCAPIRedirectURI);
}

/**
 * Returns SCAPI Shop Url
 * @param {Object} urlData - URL data
 * @returns {string} - OCAPI Base Shop Url
 */
function getSCAPIShopUrl(urlData) {
    var family = urlData.family || '';
    var name = urlData.name || '';
    var resource = urlData.resource || '';

    // URL pattern: https://{{shortCode}}.api.commercecloud.salesforce.com/{{apiFamily}}/{{apiName}}/v1/organizations/{{organizationId}}/{{apiResource}}
    var url = 'https://' + this.getSCAPIShortCode() + '.api.commercecloud.salesforce.com/' + family + name + this.getSCAPIVersion() + '/organizations/' + this.getSCAPIOrganizationId() + resource;

    return url;
}

/**
 * Gets SCAPI authorization type
 * @return {string} - SCAPI authorization type
 */
function getSCAPIAuthType() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    return globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geSCAPIAuthType);
}

/**
 * Checks if is used SCAPI Private Client authorization type
 * @return {boolean} - Returns true if is used SCAPI Private Client authorization type, otherwise false
 */
function isSCAPIPrivateClientAuthType() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    return getSCAPIAuthType() === globaleHelpers.consts.capi.PRIVATE_CLIENT_SCAPI_AUTH_TYPE;
}

/**
 * Gets CAPI type that should be used
 * @return {string} - Returns CAPI type
 */
function getCAPIType() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    return globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geCAPIType);
}

/**
 * Checks if the request is S2S order create related
 * @return {boolean} - Returns true if the request is S2S order create related, otherwise false
 */
function isCAPIOrderCreateRequest() {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    // return false if there is not OCAPI/SCAPI request
    if (globaleRequest.get('clientId') === null) {
        return false;
    }

    var httpParameterMap = globaleRequest.get('httpParameterMap');
    var orderCreateParam = globaleHelpers.consts.capi.ORDER_CREATE_REQUEST_PARAM;
    var isOrderCreateRequest = httpParameterMap.isParameterSubmitted(orderCreateParam) && httpParameterMap[orderCreateParam].booleanValue;

    return isOrderCreateRequest;
}

/**
 * Checks if the request includes a parameter to get the Send Cart token
 * @return {boolean} - Returns true if the request includes a parameter to get the Send Cart token, otherwise false
 */
function isCAPIGetCartTokenRequest() {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    // return false if there is not OCAPI/SCAPI request
    if (globaleRequest.get('clientId') === null) {
        return false;
    }

    var httpParameterMap = globaleRequest.get('httpParameterMap');
    var getCartTokenParam = globaleHelpers.consts.capi.GET_CART_TOKEN_PARAM;
    var isGetCartTokenRequest = httpParameterMap.isParameterSubmitted(getCartTokenParam) && httpParameterMap[getCartTokenParam].booleanValue;

    return isGetCartTokenRequest;
}

/**
 * Checks if the response should return the Global-e SDK init data
 * @return {boolean} - Returns true if the response should return the Global-e SDK init data, otherwise false
 */
function isCAPIGetSDKInitDataRequest() {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    // return false if there is not OCAPI/SCAPI request
    if (globaleRequest.get('clientId') === null) {
        return false;
    }

    var httpParameterMap = globaleRequest.get('httpParameterMap');
    var getSDKInitDataParam = globaleHelpers.consts.capi.GET_SDK_INIT_DATA_PARAM;
    var isGetSDKInitDataRequest = httpParameterMap.isParameterSubmitted(getSDKInitDataParam) && httpParameterMap[getSDKInitDataParam].booleanValue;

    return isGetSDKInitDataRequest;
}

/**
 * Returns request locale id
 * @returns {string} - Request locale id
 */
function getRequestLocaleId() {
    var globaleRequest = require('*/cartridge/models/globale/request');

    var httpParameterMap = globaleRequest.get('httpParameterMap');
    var localeId = null;

    if (httpParameterMap.isParameterSubmitted('locale') && httpParameterMap.locale.value) {
        localeId = httpParameterMap.locale.value.replace('-', '_');
    }

    return localeId;
}

/**
 * Returns request Site ID
 * @return {string} - Returns request Site ID
 */
function getCAPIRequestSiteId() {
    var Site = require('dw/system/Site');
    var siteId = Site.current.ID;

    return siteId;
}

/**
 * Returns request locale ID
 * @return {string} - Returns request locale ID
 */
function getCAPIRequestLocaleId() {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var locale = globaleRequest.get('locale').replace('_', '-');

    return locale;
}

/**
 * Returns request reserved SFCC order number
 * @returns {string|null} - Request reserved order id if it presents, otherwise null
 */
function getCAPIRequestReservedOrderNo() {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var httpParameterMap = globaleRequest.get('httpParameterMap');
    var reservedOrderNoParam = globaleHelpers.consts.capi.RESERVED_ORDER_NO_PARAM;
    var reservedOrderNo = (httpParameterMap.isParameterSubmitted(reservedOrderNoParam) && httpParameterMap[reservedOrderNoParam].value) || null;

    return reservedOrderNo;
}

/**
 * Returns request country code
 * @returns {string|null} - Request country code
 */
function getCAPIRequestCountryCode() {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var globaleCountryHelpers = require('*/cartridge/scripts/helpers/globaleCountryHelpers');
    var geCountryMgr = require('*/cartridge/scripts/factories/globale/geCountryMgr');

    var httpParameterMap = globaleRequest.get('httpParameterMap');
    var countryCodeParam = globaleHelpers.consts.capi.COUNTRY_CODE_PARAM;
    var countryCode = null;

    // get country code from request locale (if enabled)
    if (geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccParseCountryCodeFromRequestLocale, false, 'boolean')) {
        var requestCountryCode = globaleCountryHelpers.getCountryCodeFromLocale();
        if (requestCountryCode && geCountryMgr.isCountryExists(requestCountryCode)) {
            countryCode = requestCountryCode;
        }
    }

    // get country code from the parameter in the request URL
    if (
        !countryCode && httpParameterMap.isParameterSubmitted(countryCodeParam) && httpParameterMap[countryCodeParam].value &&
        geCountryMgr.isCountryExists(httpParameterMap[countryCodeParam].value)
    ) {
        countryCode = httpParameterMap[countryCodeParam].value;
    }

    return countryCode;
}

/**
 * Returns request currency code
 * @param {string} countryCode - Request country code
 * @returns {string|null} - Request currency code
 */
function getCAPIRequestCurrencyCode(countryCode) {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geCurrencyMgr = require('*/cartridge/scripts/factories/globale/geCurrencyMgr');
    var geCountryMgr = require('*/cartridge/scripts/factories/globale/geCountryMgr');

    var httpParameterMap = globaleRequest.get('httpParameterMap');
    var currencyCodeParam = globaleHelpers.consts.capi.CURRENCY_CODE_PARAM;
    var currencyCode = null;

    // get currency code from the parameter in the request URL
    if (
        httpParameterMap.isParameterSubmitted(currencyCodeParam) && httpParameterMap[currencyCodeParam].value &&
        geCurrencyMgr.isCurrencyExists(httpParameterMap[currencyCodeParam].value)
    ) {
        currencyCode = httpParameterMap[currencyCodeParam].value;
    }

    // get currency code by request country
    if (!currencyCode && countryCode && geCountryMgr.isCountryExists(countryCode)) {
        currencyCode = geCountryMgr.getDefaultCurrencyCode(countryCode);
    }

    return currencyCode;
}

/**
 * Returns request auth token
 * @returns {string|null} - Request auth token
 */
function getCAPIRequestAuthToken() {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var httpHeaders = globaleRequest.get('httpHeaders');
    var authToken = httpHeaders.get('Authorization') || httpHeaders.get('authorization') || httpHeaders.get(globaleHelpers.consts.capi.AUTH_TOKEN_PARAM) || null;

    return authToken;
}

/**
 * Set SFCC locale in context of OCAPI request
 * @throws {Error}
 * @returns {void}
 */
function setCAPIRequestLocale() {
    var Locale = require('dw/util/Locale');

    // get locale id
    var localeId = getRequestLocaleId();

    // set locale
    if (localeId) {
        var locale = Locale.getLocale(localeId);
        if (locale) {
            request.setLocale(localeId);
        }
    }
}

/**
 * Init SFCC Globale session in context of OCAPI request
 * @returns {void}
 */
function initCAPIGlobaleSession() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    // get country code
    var countryCode = getCAPIRequestCountryCode();

    // get currency code
    var currencyCode = getCAPIRequestCurrencyCode(countryCode);

    // set session
    if (countryCode && currencyCode) {
        globaleHelpers.setSession(countryCode, currencyCode);
    }
}

/**
 * Generates a code verifier and code challenge for use with CAPI requests
 * @returns {Object} - Object containing the code verifier and code challenge
 */
function generateCAPICodeVerifierAndChallenge() {
    var SecureRandom = require('dw/crypto/SecureRandom');
    var Encoding = require('dw/crypto/Encoding');
    var MessageDigest = require('dw/crypto/MessageDigest');
    var Bytes = require('dw/util/Bytes');

    var random = new SecureRandom();
    var codeVerifier = Encoding.toBase64(random.nextBytes(96)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    var messageDigest = new MessageDigest(MessageDigest.DIGEST_SHA_256);
    var codeChallenge = Encoding.toBase64(messageDigest.digestBytes(new Bytes(codeVerifier))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    return {
        code_verifier: codeVerifier,
        code_challenge: codeChallenge
    };
}

/**
 * Returns Serialized SessionId for Global-e SendCart API
 * @param {dw.customer.Customer} customer - Customer
 * @returns {string|null} - SendCart SessionId
*/
function getCAPISerializedSessionId(customer) {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var scapiEnabled = isSCAPIEnabled();
    var dwsidCookie = globaleRequest.get('httpCookies').dwsid;
    var dwsidExists = dwsidCookie && dwsidCookie.value;
    var isCustomerRegistered = customer.isRegistered();

    // Ensure 'dwsid' cookie exists in the request if customer is registered or if SCAPI is disabled
    if (!dwsidExists && (isCustomerRegistered || !scapiEnabled)) {
        return null;
    }

    var sessionId = {
        isCustomerRegistered: isCustomerRegistered,
        loginId: null
    };

    if (isCustomerRegistered) { // registered customer
        var profile = customer.getProfile();
        sessionId.dwsid = dwsidCookie.value;
        sessionId.loginId = profile.getEmail();
    } else if (scapiEnabled) { // guest customer SCAPI
        sessionId.dwsgst = session.generateGuestSessionSignature();
    } else { // guest customer OCAPI
        sessionId.dwsid = dwsidCookie.value;
    }

    return JSON.stringify(sessionId);
}

/**
 * Returns Parsed/Deserialized SessionId for Global-e SendCart API
 * @param {string|null} sessionId - SessionId
 * @returns {Object|null} - SendCart SessionId object or null
*/
function getCAPIDeserializedSessionId(sessionId) {
    var sessionIdObj = null;

    try {
        if (sessionId) {
            sessionIdObj = JSON.parse(sessionId);
        }
    } catch (e) {
        // do nothing
    }

    return sessionIdObj;
}

/**
 * Returns request SFCC basket currency code
 * @returns {string|null} - Request basket currency code if it presents, otherwise null
 */
function getCAPIRequestBasketCurrencyCode() {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var httpParameterMap = globaleRequest.get('httpParameterMap');
    var basketCurrencyCodeParam = globaleHelpers.consts.capi.BASKET_CURRENCY_CODE_PARAM;
    var basketCurrencyCode = (httpParameterMap.isParameterSubmitted(basketCurrencyCodeParam) && httpParameterMap[basketCurrencyCodeParam].value) || null;

    return basketCurrencyCode;
}

/**
 * Returns request SFCC basket hash
 * @returns {string|null} - Request basket hash if it presents, otherwise null
 */
function getCAPIRequestBasketHash() {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var httpParameterMap = globaleRequest.get('httpParameterMap');
    var basketHashParam = globaleHelpers.consts.capi.BASKET_HASH_PARAM;
    var basketHash = httpParameterMap.isParameterSubmitted(basketHashParam) && httpParameterMap[basketHashParam].value
        ? decodeURIComponent(httpParameterMap[basketHashParam].value)
        : null;

    return basketHash;
}

module.exports = {
    // Helper functions for OCAPI
    getOCAPIVersion: getOCAPIVersion,
    getOCAPIClientId: getOCAPIClientId,
    getOCAPIShopUrl: getOCAPIShopUrl,
    // Helper functions for SCAPI
    isSCAPIEnabled: isSCAPIEnabled,
    getSCAPIShortCode: getSCAPIShortCode,
    getSCAPIVersion: getSCAPIVersion,
    getSCAPIOrganizationId: getSCAPIOrganizationId,
    getSCAPIClientId: getSCAPIClientId,
    getSCAPIClientSecret: getSCAPIClientSecret,
    getSCAPIRedirectURI: getSCAPIRedirectURI,
    getSCAPIShopUrl: getSCAPIShopUrl,
    isSCAPIPrivateClientAuthType: isSCAPIPrivateClientAuthType,
    getSCAPIAuthType: getSCAPIAuthType,
    // Helper functions for Commerce API
    getCAPIType: getCAPIType,
    isCAPIOrderCreateRequest: isCAPIOrderCreateRequest,
    isCAPIGetCartTokenRequest: isCAPIGetCartTokenRequest,
    isCAPIGetSDKInitDataRequest: isCAPIGetSDKInitDataRequest,
    getCAPIRequestSiteId: getCAPIRequestSiteId,
    getCAPIRequestLocaleId: getCAPIRequestLocaleId,
    getCAPIRequestReservedOrderNo: getCAPIRequestReservedOrderNo,
    getCAPIRequestCountryCode: getCAPIRequestCountryCode,
    getCAPIRequestCurrencyCode: getCAPIRequestCurrencyCode,
    getCAPIRequestAuthToken: getCAPIRequestAuthToken,
    setCAPIRequestLocale: setCAPIRequestLocale,
    initCAPIGlobaleSession: initCAPIGlobaleSession,
    generateCAPICodeVerifierAndChallenge: generateCAPICodeVerifierAndChallenge,
    getCAPISerializedSessionId: getCAPISerializedSessionId,
    getCAPIDeserializedSessionId: getCAPIDeserializedSessionId,
    getCAPIRequestBasketCurrencyCode: getCAPIRequestBasketCurrencyCode,
    getCAPIRequestBasketHash: getCAPIRequestBasketHash
};
