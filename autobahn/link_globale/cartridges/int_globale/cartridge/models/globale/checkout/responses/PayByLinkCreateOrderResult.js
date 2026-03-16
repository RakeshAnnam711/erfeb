'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents PayByLinkCreateOrderResult
 * @constructor
 */
function PayByLinkCreateOrderResult() {
    AbstractOperationResult.call(this);

    this.success = null;
    this.errorCode = null;
    this.errorMessage = null;
    this.orderToken = null;
    this.gePayByLinkUrl = null;
    this.orderNo = null;
}

/* Inherits AbstractAction */
PayByLinkCreateOrderResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = PayByLinkCreateOrderResult;
