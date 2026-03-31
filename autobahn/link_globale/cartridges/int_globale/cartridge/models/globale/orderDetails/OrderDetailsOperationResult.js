'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents OrderDetailsOperationResult
 * @constructor
 */
function OrderDetailsOperationResult() {
    AbstractOperationResult.call(this);

    this.success = null;
    this.orderDetails = null;
    this.errorCode = null;
    this.errorMessage = null;
}

/* Inherits AbstractAction */
OrderDetailsOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = OrderDetailsOperationResult;
