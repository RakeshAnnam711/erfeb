'use strict';

var AbstractGeRequest = require('*/cartridge/models/globale/generic/AbstractGeRequest');

/**
 * Represents OrderUpdateStatusMixedOrdersRequest
 * @constructor
 * @throws {Error}
 */
function OrderUpdateStatusMixedOrdersRequest() {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();

    AbstractGeRequest.call(this);

    this.getRequestPayloadData();
    logger.info('GLOBALE_OrderUpdateStatusMixedOrdersRequest: {0}', JSON.stringify(this.payload));
}

/* Inherits AbstractGeRequest */
OrderUpdateStatusMixedOrdersRequest.prototype = Object.create(AbstractGeRequest.prototype);

/**
 * Validates JSON payload
 * @param {Object} validationSchema - JSON validation schema
 * @param {Object} payload - Payload
 */
OrderUpdateStatusMixedOrdersRequest.prototype.validate = function (validationSchema, payload) {
    var validator = require('*/cartridge/scripts/util/globale/validator');
    this.validation = validator.validate(payload, validationSchema);
};

module.exports = OrderUpdateStatusMixedOrdersRequest;
