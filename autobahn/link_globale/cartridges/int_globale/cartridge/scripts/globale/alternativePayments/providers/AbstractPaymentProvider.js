'use strict';

/**
 * Represent abstract alternative payment
 * @constructor
 * @param {string} geOrderId - Global-e Order ID
 */
function AbstractPaymentProvider(geOrderId) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    this.geOrderId = geOrderId;
    this.logger = globaleHelpers.getLogger();
}

/**
 * Processes Global-e Validate API Call
 * @throws {Error}
 */
AbstractPaymentProvider.prototype.validate = function () {
    throw new Error('validate function must be implemented by subclass!');
};

/**
 * Processes Global-e Redeem API Call
 * @throws {Error}
 */
AbstractPaymentProvider.prototype.redeem = function () {
    throw new Error('redeem function must be implemented by subclass!');
};

/**
 * Processes Global-e Refund API Call
 * @throws {Error}
 */
AbstractPaymentProvider.prototype.refund = function () {
    throw new Error('refund function must be implemented by subclass!');
};

module.exports = AbstractPaymentProvider;
