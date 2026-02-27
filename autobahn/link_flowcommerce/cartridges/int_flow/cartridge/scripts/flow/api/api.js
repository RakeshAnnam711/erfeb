/* global empty:false */
'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var StringUtils = require('dw/util/StringUtils');
var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
var OrderApi = require('*/cartridge/scripts/flow/api/order');
var ConfigurationApi = require('*/cartridge/scripts/flow/api/configuration');
var ShippingApi = require('*/cartridge/scripts/flow/api/shipping');
var ExperienceApi = require('*/cartridge/scripts/flow/api/experience');
var CheckoutApi = require('*/cartridge/scripts/flow/api/checkout');
var SessionApi = require('*/cartridge/scripts/flow/api/session');

var apiToken = FlowHelper.apiToken ? StringUtils.encodeBase64(FlowHelper.apiToken) : '';

/**
 * Create the API Service
 */
var flowService = LocalServiceRegistry.createService('FlowAPI', {
    createRequest: function (service, payload) {
        if (payload) {
            return JSON.stringify(payload);
        }
        return null;
    },

    parseResponse: function (service, response) {
        return response.text || null;
    },

    getRequestLogMessage: function (request) {
        return request;
    },

    getResponseLogMessage: function (response) {
        return response.text;
    }
});

/**
 * Create the URL Parameters for the service call. Orders Params based on the key index
 * @param {Array} paramKeys - Sorted Array of keys (Set in actions.json)
 * @param {Object} paramValues - Map of values to be inserted into Service URL
 * @returns {Array} The sorted parameter values
 */
function makeParams(paramKeys, paramValues) {
    var keys = paramKeys || [];
    var values = paramValues || {};

    return keys.map(function (key) {
        return values[key];
    });
}

/**
 * Default Resolver of a Flow API call
 * @param {Object} result - The result object of the service call.
 * @returns {boolean} Flag shows if the Flow Api Call returned a value
 */
function defaultResolver(result) {
    return !empty(result);
}

/**
 * Makes a request to the Flow Api
 * @param {Object} action - The Api Action to call (From actions.json)
 * @param {Object} params - Map of values to be inserted into Service URL
 * @param {Object} payload - Map of values to be inserted into the Api call body
 * @param {Object} callback - Resolver function to process the results
 * @returns {Object} The processed results of the Api call.
 */
function makeRequest(action, params, payload, callback) {
    var result;

    var resolver = callback || defaultResolver;
    var paramValues = params || {};

    if (!action) {
        throw new Error('No Flow endpoint found for action ' + action.key);
    }

    if (action.auth === 'session') {
        flowService.addHeader('Authorization', 'Session ' + FlowHelper.sessionId);
    } else {
        flowService.addHeader('Authorization', 'Basic ' + apiToken);
    }

    if (action.cacheable) {
        flowService.setCachingTTL(300);
    } else {
        flowService.setCachingTTL(0);
    }

    paramValues.organization = FlowHelper.organizationId;

    flowService.setRequestMethod(action.method);
    flowService.setURL(flowService.getConfiguration().getCredential().getURL() + StringUtils.format(action.uri,
        makeParams(action.paramKeys, paramValues)));

    result = flowService.call(payload);

    if (!result || !result.ok) {
        FlowHelper.logger.error('flow/api/api.js - Error executing {0} - url: {1} - status: {2} - msg: {3} - errorMessage: {4}  - error: {5}',
            action.key,
            flowService.getURL(),
            result.status,
            result.msg,
            result.errorMessage,
            result.error);

        return defaultResolver(null);
    }

    return resolver(JSON.parse(result.object) || { ok: true });
}

module.exports = {
    order: new OrderApi(makeRequest, FlowHelper.romanizeAddresses),
    configuration: new ConfigurationApi(makeRequest),
    shipping: new ShippingApi(makeRequest),
    experience: new ExperienceApi(makeRequest),
    checkout: new CheckoutApi(makeRequest),
    session: new SessionApi(makeRequest)
};
