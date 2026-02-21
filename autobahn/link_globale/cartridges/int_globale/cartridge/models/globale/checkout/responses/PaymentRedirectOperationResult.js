'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents PaymentRedirectOperationResult
 * @constructor
 */
function PaymentRedirectOperationResult() {
    AbstractOperationResult.call(this);

    this.success = null;
    this.cartToken = null;
    this.errorCode = null;
    this.errorMessage = null;
}

/* Inherits AbstractAction */
PaymentRedirectOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = PaymentRedirectOperationResult;
