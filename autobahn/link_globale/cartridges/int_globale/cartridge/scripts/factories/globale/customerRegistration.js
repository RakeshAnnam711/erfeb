'use strict';

/**
 * Returns JSON Payload Data sent from Global-e to SFCC
 * @throws {Error}
 * @returns {Object} - Request payload data
 */
function getPayloadData() {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var httpParameterMap = globaleRequest.get('httpParameterMap');
    var httpMethod = globaleRequest.get('httpMethod');
    var payloadJson = null;
    if (httpMethod !== 'POST') {
        return null;
    }
    var payload = httpParameterMap.requestBodyAsString;
    if (!payload) {
        throw new Error('Empty payload.');
    }
    payloadJson = JSON.parse(payload);
    if (!payloadJson) {
        throw new Error('Empty payload.');
    }

    return payloadJson;
}

/**
 * Validates JSON payload
 * @throws {Error}
 * @param {Object} jsonPayload - JSON payload
 */
function validatePayload(jsonPayload) {
    var validator = require('*/cartridge/scripts/util/globale/validator');

    // initial check
    var jsonSchema = {
        eventName: { required: true, in: ['status', 'register'] }
    };
    var result = validator.validate(jsonPayload, jsonSchema);
    if (!result.valid) {
        throw new Error('Invalid payload: ' + JSON.stringify(result));
    }

    // additional check if eventName exists
    jsonSchema = {
        'eventData.Customer.Email': { required: true },
        'eventData.Customer.Password': { required: (jsonPayload.eventName === 'register') },
        'eventData.Customer.BillingAddress.FirstName': { required: (jsonPayload.eventName === 'register') },
        'eventData.Customer.BillingAddress.LastName': { required: (jsonPayload.eventName === 'register') },
        'eventData.Customer.ShippingAddress.FirstName': { required: (jsonPayload.eventName === 'register') },
        'eventData.Customer.ShippingAddress.LastName': { required: (jsonPayload.eventName === 'register') },
        'eventData.Customer.ShippingAddress.CountryCode': { required: (jsonPayload.eventName === 'register') },
        'eventData.Order.MerchantOrderId': { required: (jsonPayload.eventName === 'register') },
        'eventData.Order.OrderId': { required: (jsonPayload.eventName === 'register') }
    };
    result = validator.validate(jsonPayload, jsonSchema);
    if (!result.valid) {
        throw new Error('Invalid payload: ' + JSON.stringify(result));
    }

    // email to lower case
    jsonPayload.eventData.Customer.Email = jsonPayload.eventData.Customer.Email.toLowerCase(); // eslint-disable-line no-param-reassign
}

module.exports = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    var logger = globaleHelpers.getLogger();
    var result = { success: false };

    try {
        // parse payload
        var jsonPayload = getPayloadData();
        if (!jsonPayload) {
            return result;
        }

        // validate JSON payload
        validatePayload(jsonPayload);

        // process request
        switch (jsonPayload.eventName) {
            case 'status':
                result = globaleHooksHelper.invokeCustomHookWithException(globaleHelpers.hooks.customerRegistration.verification, jsonPayload);
                break;
            case 'register':
                result = globaleHooksHelper.invokeCustomHookWithException(globaleHelpers.hooks.customerRegistration.registration, jsonPayload);
                break;
            default:
                break;
        }
    } catch (e) {
        logger.error('GLOBALE_REGISTER_CUSTOMER: {0}', logger.message(e));
    }

    return result;
};
