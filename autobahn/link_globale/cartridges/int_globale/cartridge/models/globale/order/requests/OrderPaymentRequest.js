'use strict';

var AbstractGeRequest = require('*/cartridge/models/globale/generic/AbstractGeRequest');

/**
 * Represents OrderPaymentRequest
 * @constructor
 * @throws {Error}
 */
function OrderPaymentRequest() {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();

    AbstractGeRequest.call(this);

    this.getRequestPayloadData();
    logger.info('GLOBALE_OrderPaymentRequest: {0}', JSON.stringify(this.payload));
}

/* Inherits AbstractGeRequest */
OrderPaymentRequest.prototype = Object.create(AbstractGeRequest.prototype);

module.exports = OrderPaymentRequest;
