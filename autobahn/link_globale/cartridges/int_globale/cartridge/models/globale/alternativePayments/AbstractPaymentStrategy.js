'use strict';

/**
 * Represents abstract payment strategy
 * @param {Object} jsonPayload - JSON Payload
 * @constructor
 */
function AbstractPaymentStrategy(jsonPayload) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    this.jsonPayload = jsonPayload;
    this.response = null;
    this.logger = globaleHelpers.getLogger();
}

/**
 * Validates payload
 * @throws {Error}
 */
AbstractPaymentStrategy.prototype.validatePayload = function () {
    throw new Error('validatePayload function must be implemented by subclass!');
};

/**
 * Gets response
 * @returns {Object} response - Response
 */
AbstractPaymentStrategy.prototype.getResponse = function () {
    return this.response;
};

/**
 * Sets response
 * @param {Object} response - Response value
 */
AbstractPaymentStrategy.prototype.setResponse = function (response) {
    this.response = response;
};

/**
 * Processes Global-e Validate API Call
 * @throws {Error}
 */
AbstractPaymentStrategy.prototype.validate = function () {
    throw new Error('validate function must be implemented by subclass!');
};

/**
 * Processes Global-e Redeem API Call
 * @throws {Error}
 */
AbstractPaymentStrategy.prototype.redeem = function () {
    throw new Error('redeem function must be implemented by subclass!');
};

/**
 * Processes Global-e Refund API Call
 * @throws {Error}
 */
AbstractPaymentStrategy.prototype.refund = function () {
    throw new Error('refund function must be implemented by subclass!');
};

module.exports = AbstractPaymentStrategy;
