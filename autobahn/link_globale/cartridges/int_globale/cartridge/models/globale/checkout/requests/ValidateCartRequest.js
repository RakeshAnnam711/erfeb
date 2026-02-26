'use strict';

var AbstractGeRequest = require('*/cartridge/models/globale/generic/AbstractGeRequest');

/**
 * Represents ValidateCartRequest
 * @constructor
 * @throws {Error}
 */
function ValidateCartRequest() {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();

    AbstractGeRequest.call(this);

    this.getRequestPayloadData();
    logger.info('GLOBALE_ValidateCartRequest: {0}', JSON.stringify(this.payload));
}

/* Inherits AbstractGeRequest */
ValidateCartRequest.prototype = Object.create(AbstractGeRequest.prototype);

module.exports = ValidateCartRequest;
