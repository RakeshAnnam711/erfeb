'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents PayByLinkOrderCancelOperationResult
 * @constructor
 */
function PayByLinkOrderCancelOperationResult() {
    AbstractOperationResult.call(this);
    this.success = null;
    this.stats = {
        total: 0,
        processed: 0,
        failed: 0
    };
}

/* Inherits AbstractAction */
PayByLinkOrderCancelOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = PayByLinkOrderCancelOperationResult;
