'use strict';

const serviceName = 'int_paypal.http.rest';
const ServiceCredential = require('dw/svc/ServiceCredential');
const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const Resource = require('dw/web/Resource');
const tokenCache = require('dw/system/CacheMgr').getCache('paypalRestOauthToken');

const paypalUtils = require('*/cartridge/scripts/paypal/utils');
const paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');
const paypalConstants = require('*/cartridge/config/constants');
const preferences = require('*/cartridge/config/preferences');

const HEADER_CONTENT_TYPE = 'Content-Type';

/**
 * Get JWT (JSON Web Token)
 * @returns {string} - JSON Web Token
 */
function getJwt() {
    const signature = '';
    const header = { alg: 'none' };
    const payload = { iss: paypalUtils.getClientId(), payer_id: preferences.paypalMerchantId };

    return [paypalUtils.encodeString(header), paypalUtils.encodeString(payload), signature].join('.');
}

/**
 * Create and store oauth token
 * @param {dw.svc.Service} service current service based on serviceName
 * @returns {string} oauth token
 */
function getToken(service) {
    const Site = require('dw/system/Site');

    const currentSiteID = Site.current.ID;
    const bearerToken = tokenCache.get(currentSiteID + '_token');

    if (bearerToken) {
        return 'Bearer ' + bearerToken;
    }

    service.setThrowOnError().call({
        createToken: true
    });

    const { error_description, access_token } = service.response;

    if (!error_description && access_token) {
        tokenCache.put(currentSiteID + '_token', access_token);

        return 'Bearer ' + access_token;
    }

    if (error_description) {
        throw new Error(error_description);
    } else {
        throw new Error(Resource.msg('service.error.unknown', 'paypalerrors', null));
    }
}

/**
 * Gets URL
 * @param {boolean} createToken whether create token flow or not
 * @param {string} payPalCustomerId paypal customer ID value
 * @param {boolean} fastlane whether Fastlane flow or not
 * @returns {string} URL
 */
function getUrl(createToken, payPalCustomerId, fastlane) {
    const baseUrl = 'v1/oauth2/token?grant_type=client_credentials';

    let url;

    if (createToken) {
        url = baseUrl;
    } else if (payPalCustomerId) {
        url = [baseUrl, '&response_type=id_token&target_customer_id=', payPalCustomerId].join('');
    } else if (fastlane) {
        let params = '&response_type=client_token&intent=sdk_init';

        if (preferences.domainList.length) {
            params += '&domains=' + preferences.domainList.toString();
        }

        url = [baseUrl, params].join('');
    } else {
        url = [baseUrl, '&response_type=id_token', payPalCustomerId].join('');
    }

    return url;
}

/**
 * createRequest callback for a service
 * @param {dw.svc.HTTPService} service service instance
 * @param {Object} data call data with path, method, body for a call or createToken in case of recursive call
 * @returns {string} request body
 */
function createRequest(service, data) {
    const credential = service.configuration.credential;

    if (!(credential instanceof ServiceCredential)) {
        throw new Error(Resource.msgf('service.nocredentials',
            'paypalerrors',
            null,
            serviceName));
    }

    const {
        path, method, body, headers, createToken, accessToken, partnerAttributionId, userIdToken,
        payPalCustomerId, fastlane, authAssertion
    } = data;

    // recursive part for access token call
    // or user_id token in case of enabled Returning customer experience
    // or for generation of Fastlane flow's SDK client token
    if (createToken || userIdToken || fastlane) {
        service.setRequestMethod('POST');
        service.setURL(paypalHelper.getUrlPath(credential, getUrl(createToken, payPalCustomerId, fastlane)));
        service.addHeader(HEADER_CONTENT_TYPE, 'application/x-www-form-urlencoded');

        if (fastlane) {
            service.addHeader('Authorization', 'Basic ' + paypalHelper.getAccessToken(credential));
        }

        return '';
    }

    const token = accessToken ? 'Bearer ' + accessToken : getToken(service);

    service.setURL(paypalHelper.getUrlPath(credential, path));
    service.addHeader(HEADER_CONTENT_TYPE, 'application/json');
    service.setRequestMethod(method || 'POST');
    service.addHeader('Authorization', token);

    if (data.payPalRequestId) {
        service.addHeader('PayPal-Request-Id', data.payPalRequestId);
    }

    if (data.payPalClientMetadataId) {
        service.addHeader('PAYPAL-CLIENT-METADATA-ID', data.payPalClientMetadataId);
    }

    if (partnerAttributionId) {
        service.addHeader('PayPal-Partner-Attribution-Id', partnerAttributionId);
    }

    if (authAssertion && preferences.paypalMerchantId) {
        service.addHeader('PayPal-Auth-Assertion', getJwt());
    }

    if (headers) {
        Object.keys(headers).forEach(function(name) {
            service.addHeader(name, headers[name]);
        });
    }

    if (data.requestType === paypalConstants.ACCESS_TOKEN) {
        service.addHeader(HEADER_CONTENT_TYPE, 'application/x-www-form-urlencoded');
        service.addHeader('Authorization', 'Basic ' + paypalHelper.getAccessToken(credential));

        return 'grant_type=authorization_code&code=' + data.code;
    }

    return body ? JSON.stringify(body) : '';
}

/**
 * Create service
 * @returns {dw.svc.Service} service instance
 */
function initService() {
    return LocalServiceRegistry.createService(serviceName, {
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
    });
}

/**
 * Handle error
 * @param {Object} errorResponse service result object with error status
 * @param {Object} requestData data for request
 */
function errorHandler(errorResponse, requestData) {
    if (!errorResponse.errorMessage) {
        paypalUtils.createErrorLog(Resource.msgf('service.wrongendpoint', 'paypalerrors', null, requestData.path));

        throw new Error();
    }

    const errorData = JSON.parse(errorResponse.errorMessage);

    let errorName;
    let errorDescription;

    // For type error ex -> {"error", "error_description"}
    if (errorData.error) {
        errorName = errorData.error;
        errorDescription = errorData.error_description;
    } else if (errorData.message) {
        errorName = errorData.name;
        errorDescription = errorData.message;
    } else {
        // For error details with issue -> {"name", "message", "details": [{"issue", "description"}]}
        errorName = errorData.details && errorData.details.length ? errorData.details[0].issue : errorData.name;
        errorDescription = errorData.details && errorData.details.length ? errorData.details[0].description : errorData.message;
    }

    errorName.toLowerCase() === 'invalid_client'
        ? paypalUtils.createErrorLog(Resource.msgf('service.wrongcredentials', 'paypalerrors', null, errorResponse.configuration.credential.ID))
        : paypalUtils.createErrorLog(errorDescription);

    throw new Error(errorName.toLowerCase());
}

/**
 * Exports IIF and it returns object with call function for making a service call
 * @param {Object} data data for making request
 * @param {Object} object with call function
 */
module.exports = (function() {
    let restService;

    try {
        restService = initService();
    } catch (error) {
        paypalUtils.createErrorLog(Resource.msgf('service.error', 'paypalerrors', null, serviceName));

        throw new Error(error);
    }

    return {
        call: function(data) {
            const result = restService.call(data);

            if (!result.isOk()) {
                errorHandler(result, data);
            }

            if (result.object) {
                result.object.ok = result.ok;
            }

            return result.object;
        }
    };
}());
