'use strict';

var AbstractGeRequest = require('*/cartridge/models/globale/generic/AbstractGeRequest');

/**
 * Represents OrderRefundInfoRequest
 * @constructor
 * @throws {Error}
 */
function OrderRefundInfoRequest() {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();

    AbstractGeRequest.call(this);

    this.getRequestPayloadData();
    logger.info('GLOBALE_OrderRefundInfoRequest: {0}', JSON.stringify(this.payload));
}

/* Inherits AbstractGeRequest */
OrderRefundInfoRequest.prototype = Object.create(AbstractGeRequest.prototype);

module.exports = OrderRefundInfoRequest;
