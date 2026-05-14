'use strict';

var AbstractGeRequest = require('*/cartridge/models/globale/generic/AbstractGeRequest');

/**
 * Represents OrderCreateRequest
 * @constructor
 * @throws {Error}
 */
function OrderCreateRequest() {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();

    AbstractGeRequest.call(this);

    this.getRequestPayloadData();
    logger.info('GLOBALE_OrderCreateRequest: {0}', JSON.stringify(this.payload));
}

/* Inherits AbstractGeRequest */
OrderCreateRequest.prototype = Object.create(AbstractGeRequest.prototype);

module.exports = OrderCreateRequest;
