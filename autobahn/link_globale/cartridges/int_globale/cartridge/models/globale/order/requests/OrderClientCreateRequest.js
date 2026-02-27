'use strict';

var AbstractRequest = require('*/cartridge/models/globale/generic/AbstractRequest');

/**
 * Represents OrderClientCreateRequest
 * @constructor
 * @throws {Error}
 */
function OrderClientCreateRequest() {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();

    AbstractRequest.call(this);

    this.getRequestPayloadData();
    logger.info('GLOBALE_OrderClientCreateRequest: {0}', JSON.stringify(this.payload));
}

/* Inherits AbstractRequest */
OrderClientCreateRequest.prototype = Object.create(AbstractRequest.prototype);

module.exports = OrderClientCreateRequest;
