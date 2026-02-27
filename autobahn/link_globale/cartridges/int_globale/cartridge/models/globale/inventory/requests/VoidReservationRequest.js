'use strict';

var AbstractGeRequest = require('*/cartridge/models/globale/generic/AbstractGeRequest');

/**
 * Represents VoidReservationRequest
 * @constructor
 * @param {Object} payload - request payload
 * @throws {Error}
 */
function VoidReservationRequest(payload) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();

    AbstractGeRequest.call(this);

    if (payload) {
        this.payload = payload;
    } else {
        this.getRequestPayloadData();
    }
    logger.info('GLOBALE_InventoryVoidReservationRequest: {0}', JSON.stringify(this.payload));
}

/* Inherits AbstractGeRequest */
VoidReservationRequest.prototype = Object.create(AbstractGeRequest.prototype);

module.exports = VoidReservationRequest;
