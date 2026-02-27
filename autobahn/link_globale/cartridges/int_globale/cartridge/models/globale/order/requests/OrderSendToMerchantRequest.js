'use strict';

var AbstractGeRequest = require('*/cartridge/models/globale/generic/AbstractGeRequest');

/**
 * Represents OrderSendToMerchantRequest
 * @constructor
 * @throws {Error}
 */
function OrderSendToMerchantRequest() {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();

    AbstractGeRequest.call(this);

    this.getRequestPayloadData();
    logger.info('GLOBALE_OrderSendToMerchantRequest: {0}', JSON.stringify(this.payload));
}

/* Inherits AbstractGeRequest */
OrderSendToMerchantRequest.prototype = Object.create(AbstractGeRequest.prototype);

module.exports = OrderSendToMerchantRequest;
