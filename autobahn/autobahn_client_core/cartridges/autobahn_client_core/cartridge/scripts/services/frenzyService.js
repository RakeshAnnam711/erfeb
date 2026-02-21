'use strict';

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const encoding = require('dw/crypto/Encoding');
const Bytes = require('dw/util/Bytes');

/**
 * This is a description of the prepareRequest function.
 * @param {dw.svc.ServiceConfig} svcConfig - This is the service configuration
 * @param {Object} args - This is the data passed while calling this function
 * @returns {Object} - requestData
*/
const prepareRequest = function (svcConfig, args) {
    const requestData = {};
    requestData.payload = args.requestData;
    requestData.type = 'application/json';
    requestData.auth_key_value = args.auth_key_value;
    const endpoint = args.endpoint || '';
    requestData.url = svcConfig.credential.URL + endpoint;
    return requestData;
};

/**
 * This is a description of the frenzyService function.
 * @param {string} serviceId - This is the service Id
 * @returns {dw.svc.Service} - This returns a service object
 */
const frenzyService = function (serviceId) {
    return LocalServiceRegistry.createService(serviceId, {

        createRequest: function (svc, args) {
            const svcConfig = svc.configuration;
            const requestData = prepareRequest(svcConfig, args);
            const payload = requestData.payload;
            const url = requestData.url;
            const contentType = requestData.type;
            const auth_key_value = requestData.auth_key_value;

            svc.addHeader('Content-Type', contentType);
            svc.addHeader('X-Frenzy-Authorization', auth_key_value);
            svc.setRequestMethod('POST');
            svc.setURL(url);

            if (payload) {
                return JSON.stringify(payload);
            }
        },

        parseResponse: function (svc, client) {
            return JSON.parse(client.text);
        },

        /**
         * This function is used for returning mocked response when service is mocked
         * @param {dw.svc.ServiceConfig} svc - This is the service configuration object
         * @returns {Object} - This returns a mock response
        */
        mockCall: function (svc) {
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: 'MOCK RESPONSE (' + svc.URL + ')'
            };
        },

        /**
         * This function handles how the request is logged.
         * @param {Object} request - This is the request object
         * @returns {string} - this returns a string
        */
        getRequestLogMessage: function (request) {
            try {
                return JSON.stringify(request);
            } catch (e) {
                return e;
            }
        },

        /**
         * This function handles how the response is logged.
         * @param {Object} response - This is the request object
         * @returns {string} - this returns a string
        */
        getResponseLogMessage: function (response) {
            try {
                return JSON.stringify(response);
            } catch (e) {
                return e;
            }
        }
    });
};

module.exports = {
    frenzyService: frenzyService
};
