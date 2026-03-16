'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents OrderNotificationOperationResult
 * @constructor
 */
function OrderNotificationOperationResult() {
    AbstractOperationResult.call(this);
    this.success = null;
    this.stats = {
        total: 0,
        processed: 0,
        failed: 0,
        errors: 0
    };
}

/* Inherits AbstractAction */
OrderNotificationOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = OrderNotificationOperationResult;
