'use strict';

const ServiceCredential = require('dw/svc/ServiceCredential');
const Resource = require('dw/web/Resource');
const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const tokenCache = require('dw/system/CacheMgr').getCache('bm_paypalRestOauthToken');

const utils = require('~/cartridge/scripts/paypal/utils');
const constants = require('~/cartridge/config/constants');
const preferences = require('~/cartridge/config/preferences');

/**
 * Get JWT (JSON Web Token)
 * @returns {string} - JSON Web Token
 */
function getJwt() {
    const signature = '';
    const header = { alg: 'none' };
    const payload = { iss: preferences.clientId, payer_id: preferences.paypalMerchantId };

    return [utils.encodeString(header), utils.encodeString(payload), signature].join('.');
}

/**
 * Create URL for a call
 * @param  {dw.svc.ServiceCredential} credential current service credential
 * @param  {string} path REST action endpoint
 * @returns {string} url for a call
 */
function getUrlPath(credential, path) {
    let url = credential.URL;

    if (!url.match(/.+\/$/)) {
        url += '/';
    }

    url += path;

    return url;
}

/**
 * Create and store oauth token
 * @param  {dw.svc.Service} service current service based on serviceName
 * @returns {string} oauth token
 */
function getToken(service) {
    const Site = require('dw/system/Site');

    const currentSiteID = Site.current.ID;
    const bearerToken = tokenCache.get(currentSiteID + '_bm_token');

    if (bearerToken) {
        return 'Bearer ' + bearerToken;
    }

    const result = service.setThrowOnError().call({
        createToken: true
    });

    if (!result.ok) {
        require('~/cartridge/scripts/helpers/serviceHelpers').errorHandler(result, {});
    }

    const {
        error_description,
        access_token
    } = service.response;

    if (!error_description && access_token) {
        tokenCache.put(currentSiteID + '_bm_token', access_token);

        return 'Bearer ' + access_token;
    }

    throw new Error(error_description);
}

/** createRequest callback for a service
 * @param  {dw.svc.HTTPService} service service instance
 * @param  {Object} data call data with path, method, body for a call or createToken in case of recursive call
 * @returns {string} request body
 */
function createRequest(service, data) {
    const credential = service.configuration.credential;

    if (!(credential instanceof ServiceCredential)) {
        throw new Error(Resource.msgf('service.wrongcredentials', 'paypalbm', null, constants.SERVICE_NAME));
    }

    const {
        path,
        method,
        body,
        createToken,
        partnerAttributionId,
        payPalRequestId,
        authAssertion
    } = data;

    // recursive part for create token call
    if (createToken) {
        service.setURL(getUrlPath(credential, 'v1/oauth2/token?grant_type=client_credentials'));
        service.addHeader('Content-Type', 'application/x-www-form-urlencoded');

        return '';
    }

    const token = getToken(service);

    service.setURL(getUrlPath(credential, path));
    service.addHeader('Content-Type', 'application/json');
    service.setRequestMethod(method || 'POST');
    service.addHeader('Authorization', token);

    if (payPalRequestId) {
        service.addHeader('PayPal-Request-Id', payPalRequestId);
    }

    if (partnerAttributionId) {
        service.addHeader('PayPal-Partner-Attribution-Id', partnerAttributionId);
    }

    if (authAssertion && preferences.paypalMerchantId) {
        service.addHeader('PayPal-Auth-Assertion', getJwt());
    }

    return body ? JSON.stringify(body) : '';
}

/**
 * Defines callbacks for use with the LocalServiceRegistry
 *
 * @returns {Object} Request object passed to the execute method
 */
function createRestService() {
    return {
        createRequest: createRequest,
        parseResponse: function(_, httpClient) {
            return JSON.parse(httpClient.getText());
        },
        filterLogMessage: function(msg) {
            return msg;
        },
        getRequestLogMessage: function(request) {
            return request;
        },
        getResponseLogMessage: function(response) {
            return response.text;
        }
    };
}

module.exports = function() {
    return LocalServiceRegistry.createService(constants.SERVICE_NAME, createRestService());
};
