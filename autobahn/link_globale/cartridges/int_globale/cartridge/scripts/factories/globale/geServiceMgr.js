/* eslint-disable no-param-reassign */

'use strict';

/**
 * Adds Authorization and UserName headers to the service
 * @param {dw/svc/Service} service - service to add headers
 * @param {string} endpoint - service endpoint
 */
function addAuthorizationHeaders(service, endpoint) {
    var geConfigurationMgr = require('*/cartridge/scripts/factories/globale/geConfigurationMgr');
    var geAuthentication = require('*/cartridge/scripts/factories/globale/geAuthentication');

    var jwtApiAuthConfig = geConfigurationMgr.getJwtApiAuthConfig();
    if (jwtApiAuthConfig.isServiceAuthEnabled(endpoint)) {
        service.addHeader('Authorization', geAuthentication.getAuthenticationToken());
        service.addHeader('UserName', jwtApiAuthConfig.getUsername());
    }
}

/**
 * Sets specific credential to the given service. If it fails, fallback to the original credential ID
 * @param {dw/svc/Service} service - service to set credentials
 * @param  {string} originalCredentialID - original service credential ID
 * @returns {void}
 */
function setCredentialID(service, originalCredentialID) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var possibleCredentialIDs = [
        originalCredentialID + '-' + globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geClientJsMerchantId),
        originalCredentialID
    ];

    possibleCredentialIDs.some(function (credentialID) {
        try {
            service.setCredentialID(credentialID);
            return true;
        } catch (e) {
            return false;
        }
    });
}

/**
 * Returns inited service
 * @param {string} serviceName - service name
 * @param {boolean} addGuid - add guid to URL
 * @returns {dw/svc/Service} - service
 */
function initService(serviceName, addGuid) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    // service config
    var service = require('*/cartridge/scripts/globale/services/service')(serviceName);
    service.setRequestMethod('POST');
    service.addHeader('Content-Type', 'application/json');
    service.addHeader('Accept', '*/*');
    setCredentialID(service, service.getCredentialID() || service.getConfiguration().getID());

    var baseUrl = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geApiUrl);
    var merchatGUID = (service.configuration && service.configuration.credential && service.configuration.credential.password) ?
        service.configuration.credential.password.toLowerCase() :
        globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geMerchantGuid).toLowerCase();

    var serviceUrl = service.getURL().indexOf('https://') === 0 ? service.getURL() : baseUrl + service.getURL();
    if (addGuid) {
        serviceUrl += '?merchantGUID=' + merchatGUID;
    }
    service.setURL(serviceUrl);

    return service;
}

/**
 * Returns AppSettings service
 * @returns {dw/svc/Service} - service
 */
function getAppSettingsService() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var service = initService(globaleHelpers.services.appSettings, true);
    addAuthorizationHeaders(service, '/Browsing/AppSettings');

    return service;
}

/**
 * Returns AppVersion service
 * @returns {dw/svc/Service} - service
 */
function getAppVersionService() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var service = initService(globaleHelpers.services.appVersion, true);
    addAuthorizationHeaders(service, '/Browsing/AppVersion');

    return service;
}

/**
 * Returns Countries service
 * @returns {dw/svc/Service} - service
 */
function getCountriesService() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var service = initService(globaleHelpers.services.countries, true);
    addAuthorizationHeaders(service, '/Browsing/Countries');

    return service;
}

/**
 * Returns CountryCoefficients service
 * @returns {dw/svc/Service} - service
 */
function getCountryCoefficientsService() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var service = initService(globaleHelpers.services.countryCoefficients, true);
    addAuthorizationHeaders(service, '/Browsing/CountryCoefficients');

    return service;
}

/**
 * Returns Cultures service
 * @returns {dw/svc/Service} - service
 */
function getCulturesService() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var service = initService(globaleHelpers.services.locationsDefaultCulturesList, true);
    addAuthorizationHeaders(service, '/Browsing/LocationsDefaultCulturesList');

    return service;
}

/**
 * Returns Currencies service
 * @returns {dw/svc/Service} - service
 */
function getCurrenciesService() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var service = initService(globaleHelpers.services.currencies, true);
    addAuthorizationHeaders(service, '/Browsing/Currencies');

    return service;
}

/**
 * Returns CurrencyRates service
 * @returns {dw/svc/Service} - service
 */
function getCurrencyRatesService() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var service = initService(globaleHelpers.services.currencyRates, true);
    addAuthorizationHeaders(service, '/Browsing/CurrencyRates');

    return service;
}

/**
 * Returns RoundingRules service
 * @returns {dw/svc/Service} - service
 */
function getRoundingRulesService() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var service = initService(globaleHelpers.services.roundingRules, true);
    addAuthorizationHeaders(service, '/Browsing/RoundingRules');

    return service;
}

/**
 * Returns ActiveHubDetails service
 * @returns {dw/svc/Service} - service
 */
function getActiveHubDetailsService() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var service = initService(globaleHelpers.services.activeHubDetails, true);
    addAuthorizationHeaders(service, '/Browsing/ActiveHubDetails');

    return service;
}

/**
 * Returns ProductRestrictions service
 * @returns {dw/svc/Service} - service
 */
function getProductRestrictionsService() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var service = initService(globaleHelpers.services.recentProductCountry, true);
    addAuthorizationHeaders(service, '/Browsing/RecentProductCountryS');

    return service;
}

/**
 * Returns SendCart service
 * @returns {dw/svc/Service} - service
 */
function getSendCartService() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var service = initService(globaleHelpers.services.sendCart, true);
    addAuthorizationHeaders(service, '/Checkout/SendCartV2');

    return service;
}

/**
 * Returns JWT service
 * @returns {dw/svc/Service} - service
 */
function getJWTService() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var service = initService(globaleHelpers.services.jwt);

    return service;
}

/**
 * Returns ShippingDetails service
 * @returns {dw/svc/Service} - service
 */
function getShippingDetailsService() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var service = initService(globaleHelpers.services.shippingDetails, true);
    addAuthorizationHeaders(service, '/ShippingDetails/GetShippingDetails');

    return service;
}

/**
 * Returns OrderDetails service
 * @returns {dw/svc/Service} - service
 */
function getOrderDetailsService() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var service = initService(globaleHelpers.services.orderDetails, true);
    addAuthorizationHeaders(service, '/Order/GetOrdersDetails');

    return service;
}

/**
 * Returns OCAPI session bridge service
 * @throws {Error}
 * @param {string} sessionId - storefront session id
 * @returns {dw/svc/Service} - service
 */
function getOcapiSessionBridgeService(sessionId) {
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');
    var globaleService = require('*/cartridge/scripts/globale/services/service');

    // deserialize session ID
    var sessionIdJson = globaleCAPIHelpers.getCAPIDeserializedSessionId(sessionId);
    if (!sessionIdJson) {
        throw new Error('Deserialized SessionId is empty or invalid');
    }

    var service = globaleService('Globale-OCAPI');

    // get session bridge JWT
    service.setRequestMethod('POST');
    service.addHeader('Content-Type', 'application/json');
    service.addHeader('Accept', '*/*');
    service.addHeader('x-dw-client-id', globaleCAPIHelpers.getOCAPIClientId());
    service.addHeader('Cookie', ('dwsid=' + sessionIdJson.dwsid + ';'));
    service.setURL(globaleCAPIHelpers.getOCAPIShopUrl('/customers/auth'));

    var sessionBridgeResponse = service.call(JSON.stringify({ type: 'session' }));
    if (!sessionBridgeResponse.isOk()) {
        throw new Error('Impossible to get session JWT. Status: ' + sessionBridgeResponse.status + ', error: ' + sessionBridgeResponse.errorMessage + ', reason: ' + (sessionBridgeResponse.unavailableReason || 'none.'));
    }
    var sessionJWT = sessionBridgeResponse.object.getResponseHeader('Authorization') || sessionBridgeResponse.object.getResponseHeader('authorization');

    // exchange session JWT to session
    service.addHeader('Authorization', sessionJWT);
    service.addHeader('Cookie', '');
    service.setURL(globaleCAPIHelpers.getOCAPIShopUrl('/sessions'));

    var sessionResponse = service.call('');
    if (!sessionResponse.isOk()) {
        throw new Error('Impossible to get session. Status: ' + sessionResponse.status + ', error: ' + sessionResponse.errorMessage + ', reason: ' + (sessionResponse.unavailableReason || 'none.'));
    }

    return service;
}

/**
 * Returns OCAPI JWT service
 * @param {string} jwt - JWT
 * @returns {dw/svc/Service} - service
 */
function getOcapiJwtService(jwt) {
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');
    var globaleService = require('*/cartridge/scripts/globale/services/service');

    var service = globaleService('Globale-OCAPI');

    service.addHeader('Accept', '*/*');
    service.addHeader('x-dw-client-id', globaleCAPIHelpers.getOCAPIClientId());
    service.addHeader('Authorization', jwt);

    return service;
}

/**
 * Returns Private Client SCAPI session bridge service
 * @throws {Error}
 * @param {string} sessionId - storefront session id
 * @returns {dw/svc/Service} - service
 */
function getPrivateClientScapiSessionBridgeService(sessionId) {
    var StringUtils = require('dw/util/StringUtils');
    var Site = require('dw/system/Site');
    var urlUtils = require('*/cartridge/scripts/util/globale/url');
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');
    var globaleService = require('*/cartridge/scripts/globale/services/service');

    // deserialize session ID
    var sessionIdJson = globaleCAPIHelpers.getCAPIDeserializedSessionId(sessionId);
    if (!sessionIdJson) {
        throw new Error('Deserialized SessionId is empty or invalid');
    }

    var service = globaleService('Globale-SCAPI');
    var scapiClientId = globaleCAPIHelpers.getSCAPIClientId();
    var scapiClientSecret = globaleCAPIHelpers.getSCAPIClientSecret();

    // get session bridge JWT
    var sessionBridgeUrl = globaleCAPIHelpers.getSCAPIShopUrl({
        family: 'shopper/',
        name: 'auth/',
        resource: '/oauth2/session-bridge/token'
    });

    var sessionBridgeQueryParams = {
        channel_id: Site.current.ID,
        grant_type: 'client_credentials',
        login_id: sessionIdJson.isCustomerRegistered ? sessionIdJson.loginId : 'guest',
        hint: sessionIdJson.isCustomerRegistered ? 'sb-user' : 'sb-guest'
    };
    if (sessionIdJson.isCustomerRegistered) { // registered customer
        sessionBridgeQueryParams.dwsid = sessionIdJson.dwsid;
    } else { // guest customer
        sessionBridgeQueryParams.dwsgst = sessionIdJson.dwsgst;
    }

    sessionBridgeUrl = urlUtils.appendParametersToURL(sessionBridgeUrl, sessionBridgeQueryParams);

    service.setRequestMethod('POST');
    service.addHeader('Authorization', 'Basic ' + StringUtils.encodeBase64([scapiClientId, scapiClientSecret].filter(Boolean).join(':')));
    service.addHeader('Content-Type', 'application/x-www-form-urlencoded');
    service.setURL(sessionBridgeUrl);

    var sessionBridgeResponse = service.call('');
    if (!sessionBridgeResponse.isOk()) {
        throw new Error('Impossible to get session JWT. Status: ' + sessionBridgeResponse.status + ', error: ' + sessionBridgeResponse.errorMessage + ', reason: ' + (sessionBridgeResponse.unavailableReason || 'none.'));
    }

    // exchange session JWT to session
    var sessionBridgeResponseObject = JSON.parse(sessionBridgeResponse.object.text);
    var sessionJWT = 'Bearer ' + sessionBridgeResponseObject.access_token;

    service.addHeader('Authorization', sessionJWT);
    service.addHeader('Content-Type', 'application/json');
    service.addHeader('Cookie', '');
    service.setURL(globaleCAPIHelpers.getOCAPIShopUrl('/sessions'));

    var sessionResponse = service.call('');
    if (!sessionResponse.isOk()) {
        throw new Error('Impossible to get session. Status: ' + sessionResponse.status + ', error: ' + sessionResponse.errorMessage + ', reason: ' + (sessionResponse.unavailableReason || 'none.'));
    }

    return service;
}

/**
 * Returns Public Client SCAPI session bridge service
 * @throws {Error}
 * @param {string} sessionId - storefront session id
 * @returns {dw/svc/Service} - service
 */
function getPublicClientScapiSessionBridgeService(sessionId) {
    var Site = require('dw/system/Site');
    var HTTPClient = require('dw/net/HTTPClient');
    var urlUtils = require('*/cartridge/scripts/util/globale/url');
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');
    var globaleService = require('*/cartridge/scripts/globale/services/service');

    // deserialize session ID
    var sessionIdJson = globaleCAPIHelpers.getCAPIDeserializedSessionId(sessionId);
    if (!sessionIdJson) {
        throw new Error('Deserialized SessionId is empty or invalid');
    }

    var service = globaleService('Globale-SCAPI');
    var scapiClientId = globaleCAPIHelpers.getSCAPIClientId();
    var scapiRedirectURI = globaleCAPIHelpers.getSCAPIRedirectURI();
    var codeVerifierAndChallenge = globaleCAPIHelpers.generateCAPICodeVerifierAndChallenge();

    // authorize customer (Only if used Public Client)
    var authorizeUrl = globaleCAPIHelpers.getSCAPIShopUrl({
        family: 'shopper/',
        name: 'auth/',
        resource: '/oauth2/authorize'
    });
    var authorizeQueryParams = {
        client_id: scapiClientId,
        code_challenge: codeVerifierAndChallenge.code_challenge,
        redirect_uri: scapiRedirectURI,
        response_type: 'code',
        hint: sessionIdJson.isCustomerRegistered ? 'sb-user' : 'sb-guest'
    };
    authorizeUrl = urlUtils.appendParametersToURL(authorizeUrl, authorizeQueryParams);

    var authorizeClient = new HTTPClient();
    authorizeClient.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    authorizeClient.setAllowRedirect(false);
    authorizeClient.setTimeout(service.getConfiguration().getProfile().getTimeoutMillis());
    authorizeClient.open('GET', authorizeUrl);
    authorizeClient.send();

    if (authorizeClient.statusCode !== 303) { // it is expected to receive a HTTP 303 from this endpoint since HTTPClient does not follow redirects.
        throw new Error('Failed to authorize customer. Status code: ' + authorizeClient.statusCode + ', Error: ' + authorizeClient.errorText);
    }

    var locationHeader = authorizeClient.getResponseHeaders().get('Location');
    if (!locationHeader) {
        throw new Error('Failed to authorize customer. Location header does not exist');
    }
    var locationQueryParameters = urlUtils.deserializeQueryString(locationHeader[0] ? locationHeader[0].split('?')[1] : '');

    // get session bridge JWT
    var sessionBridgeUrl = globaleCAPIHelpers.getSCAPIShopUrl({
        family: 'shopper/',
        name: 'auth/',
        resource: '/oauth2/session-bridge/token'
    });
    var sessionBridgeQueryParams = {
        client_id: scapiClientId,
        channel_id: Site.current.ID,
        grant_type: 'session_bridge',
        login_id: sessionIdJson.isCustomerRegistered ? sessionIdJson.loginId : 'guest',
        code_verifier: codeVerifierAndChallenge.code_verifier,
        usid: locationQueryParameters && locationQueryParameters.usid,
        code: locationQueryParameters && locationQueryParameters.code
    };
    if (sessionIdJson.isCustomerRegistered) { // registered customer
        sessionBridgeQueryParams.dwsid = sessionIdJson.dwsid;
    } else { // guest customer
        sessionBridgeQueryParams.dwsgst = sessionIdJson.dwsgst;
    }

    sessionBridgeUrl = urlUtils.appendParametersToURL(sessionBridgeUrl, sessionBridgeQueryParams);

    service.setRequestMethod('POST');
    service.addHeader('Content-Type', 'application/x-www-form-urlencoded');
    service.setURL(sessionBridgeUrl);

    var sessionBridgeResponse = service.call('');
    if (!sessionBridgeResponse.isOk()) {
        throw new Error('Impossible to get session JWT. Status: ' + sessionBridgeResponse.status + ', error: ' + sessionBridgeResponse.errorMessage + ', reason: ' + (sessionBridgeResponse.unavailableReason || 'none.'));
    }

    // exchange session JWT to session
    var sessionBridgeResponseObject = JSON.parse(sessionBridgeResponse.object.text);
    var sessionJWT = 'Bearer ' + sessionBridgeResponseObject.access_token;

    service.addHeader('Authorization', sessionJWT);
    service.addHeader('Content-Type', 'application/json');
    service.addHeader('Cookie', '');
    service.setURL(globaleCAPIHelpers.getOCAPIShopUrl('/sessions'));

    var sessionResponse = service.call('');
    if (!sessionResponse.isOk()) {
        throw new Error('Impossible to get session. Status: ' + sessionResponse.status + ', error: ' + sessionResponse.errorMessage + ', reason: ' + (sessionResponse.unavailableReason || 'none.'));
    }

    return service;
}

/**
 * Returns SCAPI session bridge service
 * @throws {Error}
 * @param {string} sessionId - storefront session id
 * @returns {dw/svc/Service} - service
 */
function getScapiSessionBridgeService(sessionId) {
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');
    return (globaleCAPIHelpers.isSCAPIPrivateClientAuthType() ? getPrivateClientScapiSessionBridgeService(sessionId) : getPublicClientScapiSessionBridgeService(sessionId));
}

/**
 * Returns OCAPI JWT service
 * @param {string} jwt - JWT
 * @returns {dw/svc/Service} - service
 */
function getScapiJwtService(jwt) {
    var globaleService = require('*/cartridge/scripts/globale/services/service');

    var service = globaleService('Globale-SCAPI');

    service.addHeader('Accept', '*/*');
    service.addHeader('Authorization', jwt);

    return service;
}

/**
 * Returns OrderStatusUpdate service
 * @returns {dw/svc/Service} - service
 */
function getOrderStatusUpdateService() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var service = initService(globaleHelpers.services.updateOrderStatus, true);
    addAuthorizationHeaders(service, '/Order/UpdateOrderStatus');

    return service;
}

/**
 * Returns OrderDispatchUpdateService service
 * @returns {dw/svc/Service} - service
 */
function getOrderDispatchUpdateService() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var service = initService(globaleHelpers.services.updateOrderDispatch, true);
    addAuthorizationHeaders(service, '/Order/UpdateOrderDispatchV2');

    return service;
}

/**
 * Returns OrderDispatchUpdateService service
 * @returns {dw/svc/Service} - service
 */
function getOrderRefundUpdateService() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var service = initService(globaleHelpers.services.createOrderRefund, true);
    addAuthorizationHeaders(service, '/Order/CreateOrderRefund');

    return service;
}

/**
 * Returns OrderRMAUpdateService service
 * @returns {dw/svc/Service} - service
 */
function getOrderRMAUpdateService() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var service = initService(globaleHelpers.services.updateRMA, true);
    addAuthorizationHeaders(service, '/Return/UpdateRMA');

    return service;
}

/**
 * Returns SftpUpoadService service
 * @param {string} sftpCredentialID - SFTP Credential ID
 * @returns {dw/svc/Service} - service
 */
function getSftpUpoadService(sftpCredentialID) {
    var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var urlUtils = require('*/cartridge/scripts/util/globale/url');

    var service = LocalServiceRegistry.createService(globaleHelpers.services.sftpUpload, {
        execute: function (svc, file) {
            var urlData = urlUtils.parseURL(svc.URL);
            var sftpClient = svc.getClient();
            var connectionPort = urlData.port ? Number(urlData.port) : 22;
            if (!sftpClient.connect(urlData.host, connectionPort, svc.configuration.credential.user, svc.configuration.credential.password)) {
                throw new Error('Cannot connect to SFTP host ' + urlData.host + ':' + connectionPort + ', Error:\n' + sftpClient.getErrorMessage());
            }

            if (urlData.pathname !== '/' && !sftpClient.cd(urlData.pathname)) {
                // won't create SFTP folder if it does not exist, only cd
                throw new Error('Cannot cd to SFTP folder ' + urlData.pathname + ', Error:\n' + sftpClient.getErrorMessage());
            }

            sftpClient.putBinary((urlData.pathname + file.name), file);
        },
        parseResponse: function (svc, response) {
            return response;
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });
    service.setCredentialID(sftpCredentialID);
    service.setThrowOnError();

    return service;
}

module.exports = {
    getAppSettingsService: getAppSettingsService,
    getAppVersionService: getAppVersionService,
    getCountriesService: getCountriesService,
    getCountryCoefficientsService: getCountryCoefficientsService,
    getCulturesService: getCulturesService,
    getCurrenciesService: getCurrenciesService,
    getCurrencyRatesService: getCurrencyRatesService,
    getRoundingRulesService: getRoundingRulesService,
    getActiveHubDetailsService: getActiveHubDetailsService,
    getProductRestrictionsService: getProductRestrictionsService,
    getSendCartService: getSendCartService,
    getJWTService: getJWTService,
    getShippingDetailsService: getShippingDetailsService,
    getOrderDetailsService: getOrderDetailsService,
    getOcapiSessionBridgeService: getOcapiSessionBridgeService,
    getOcapiJwtService: getOcapiJwtService,
    getScapiSessionBridgeService: getScapiSessionBridgeService,
    getScapiJwtService: getScapiJwtService,
    getOrderStatusUpdateService: getOrderStatusUpdateService,
    getOrderDispatchUpdateService: getOrderDispatchUpdateService,
    getOrderRefundUpdateService: getOrderRefundUpdateService,
    getOrderRMAUpdateService: getOrderRMAUpdateService,
    getSftpUpoadService: getSftpUpoadService
};
