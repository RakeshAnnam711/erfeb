'use strict';

var AbstractGeRequest = require('*/cartridge/models/globale/generic/AbstractGeRequest');

/**
 * Represents OrderUpdateShippingInfoRequest
 * @constructor
 * @throws {Error}
 */
function OrderUpdateShippingInfoRequest() {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();

    AbstractGeRequest.call(this);

    this.getRequestPayloadData();
    logger.info('GLOBALE_OrderUpdateShippingInfoRequest: {0}', JSON.stringify(this.payload));
}

/* Inherits AbstractRequest */
OrderUpdateShippingInfoRequest.prototype = Object.create(AbstractGeRequest.prototype);

module.exports = OrderUpdateShippingInfoRequest;
