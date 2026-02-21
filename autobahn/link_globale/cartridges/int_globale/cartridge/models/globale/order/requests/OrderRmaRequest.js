'use strict';

var AbstractGeRequest = require('*/cartridge/models/globale/generic/AbstractGeRequest');

/**
 * Represents OrderRmaRequest
 * @constructor
 * @param {Object} payload - request payload
 * @throws {Error}
 */
function OrderRmaRequest(payload) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();

    AbstractGeRequest.call(this);

    if (payload) {
        this.payload = payload;
    } else {
        this.getRequestPayloadData();
    }
    logger.info('GLOBALE_OrderRmaRequest: {0}', JSON.stringify(this.payload));
}

/* Inherits AbstractGeRequest */
OrderRmaRequest.prototype = Object.create(AbstractGeRequest.prototype);

module.exports = OrderRmaRequest;
