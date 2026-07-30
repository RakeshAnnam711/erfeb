'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents ShippingDetailsOperationResult
 * @constructor
 */
function ShippingDetailsOperationResult() {
    AbstractOperationResult.call(this);

    this.success = null;
    this.shippingDetails = null;
    this.errorCode = null;
    this.errorMessage = null;
}

/* Inherits AbstractAction */
ShippingDetailsOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = ShippingDetailsOperationResult;
