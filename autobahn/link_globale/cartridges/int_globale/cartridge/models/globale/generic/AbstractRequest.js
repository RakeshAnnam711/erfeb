/* global request */

'use strict';

/**
 * Represents abstract request
 * @constructor
 */
function AbstractRequest() {
    this.payload = {};
    this.validation = null;
}

/**
 * Returns JSON Payload Data sent from Global-e to SFCC
 * @throws {Error}
 */
AbstractRequest.prototype.getRequestPayloadData = function () {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var httpParameterMap = globaleRequest.get('httpParameterMap');
    var payload = httpParameterMap.requestBodyAsString;

    if (!payload) {
        throw new Error('Empty payload.');
    }
    var payloadJson = JSON.parse(payload);
    if (!payloadJson) {
        throw new Error('Empty payload.');
    }

    this.payload = payloadJson;
};

/**
 * Validates JSON payload
 * @param {Object} validationSchema - JSON validation schema
 */
AbstractRequest.prototype.validate = function (validationSchema) {
    var validator = require('*/cartridge/scripts/util/globale/validator');
    this.validation = validator.validate(this.payload, validationSchema);
};

/**
 * Returns request locale
 * @returns {string} - request payload
 */
AbstractRequest.prototype.getRequestLocale = function () {
    return request.getLocale();
};

module.exports = AbstractRequest;
