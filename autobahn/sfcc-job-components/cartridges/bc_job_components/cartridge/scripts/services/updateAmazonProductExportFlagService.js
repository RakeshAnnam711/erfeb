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
    requestData.payload = {};
    requestData.type = 'application/json';
    requestData.requestID = 'Test';
    const endpoint = args.endpoint || '';
    requestData.url = svcConfig.credential.URL + endpoint;

    return requestData;
};

/**
 * This is a description of the updateAmazonProductExportFlagService function.
 * @param {string} serviceId - This is the service Id
 * @returns {dw.svc.Service} - This returns a service object
 */
const updateAmazonProductExportFlagService = function (serviceId) {
    return LocalServiceRegistry.createService(serviceId, {

        createRequest: function (svc, args) {
            const svcConfig = svc.configuration;
            if (!svcConfig || !svcConfig.credential || !svcConfig.credential.URL) {
                throw new Error('update Amazon Product Export Flag service URL is empty');
            }

            const requestData = prepareRequest(svcConfig, args);
            const payload = requestData.payload;
            const url = requestData.url;
            const contentType = requestData.type;
            const requestID = requestData.requestID;

            const secret = svcConfig.credential.password;
            const username = svcConfig.credential.user;
            if (!secret) {
                throw new Error('Credentials for updateAmazonProductExportFlag service are not set');
            }

            const credentials = username + ':' + secret;
            const bytesCreds = new Bytes(credentials);
            const hmacTokenStr = encoding.toBase64(bytesCreds);
            const basicEncoding = 'Basic ' + hmacTokenStr;
            svc.addHeader('Authorization', basicEncoding);

            svc.addHeader('Content-Type', contentType);
            svc.addHeader('request-id', requestID);
            svc.setRequestMethod('GET');
            svc.setURL(url);
            return payload;
        },

        parseResponse: function (svc, client) {
            return {
                statusCode: client.statusCode,
                statusMessage: client.statusMessage,
                text: client.text
            };
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
    updateAmazonProductExportFlagService: updateAmazonProductExportFlagService
};
