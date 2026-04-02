'use strict';

var AbstractGeRequest = require('*/cartridge/models/globale/generic/AbstractGeRequest');

/**
 * Represents OrderUpdateStatusRequest
 * @constructor
 * @throws {Error}
 */
function OrderUpdateStatusRequest() {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();

    AbstractGeRequest.call(this);

    this.getRequestPayloadData();
    logger.info('GLOBALE_OrderStatusUpdateRequest: {0}', JSON.stringify(this.payload));
}

/* Inherits AbstractGeRequest */
OrderUpdateStatusRequest.prototype = Object.create(AbstractGeRequest.prototype);

module.exports = OrderUpdateStatusRequest;
