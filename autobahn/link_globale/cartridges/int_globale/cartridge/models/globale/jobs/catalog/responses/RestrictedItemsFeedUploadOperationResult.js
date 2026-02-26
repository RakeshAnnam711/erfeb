'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents RestrictedItemsFeedUploadOperationResult
 * @constructor
 */
function RestrictedItemsFeedUploadOperationResult() {
    AbstractOperationResult.call(this);
    this.success = null;
}

/* Inherits AbstractAction */
RestrictedItemsFeedUploadOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = RestrictedItemsFeedUploadOperationResult;
