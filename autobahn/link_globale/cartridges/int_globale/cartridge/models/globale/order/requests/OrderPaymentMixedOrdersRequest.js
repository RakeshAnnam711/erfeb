'use strict';

var AbstractGeRequest = require('*/cartridge/models/globale/generic/AbstractGeRequest');

/**
 * Represents OrderPaymentMixedOrdersRequest
 * @constructor
 * @throws {Error}
 */
function OrderPaymentMixedOrdersRequest() {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();

    AbstractGeRequest.call(this);

    this.getRequestPayloadData();
    logger.info('GLOBALE_OrderPaymentMixedOrdersRequest: {0}', JSON.stringify(this.payload));
}

/* Inherits AbstractGeRequest */
OrderPaymentMixedOrdersRequest.prototype = Object.create(AbstractGeRequest.prototype);

/**
 * Validates JSON payload
 * @param {Object} validationSchema - JSON validation schema
 * @param {Object} payload - Payload
 */
OrderPaymentMixedOrdersRequest.prototype.validate = function (validationSchema, payload) {
    var validator = require('*/cartridge/scripts/util/globale/validator');
    this.validation = validator.validate(payload, validationSchema);
};

module.exports = OrderPaymentMixedOrdersRequest;
