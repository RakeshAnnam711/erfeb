'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents FetchProductRestrictionsOperationResult
 * @constructor
 */
function FetchProductRestrictionsOperationResult() {
    AbstractOperationResult.call(this);
    this.success = null;
}

/* Inherits AbstractAction */
FetchProductRestrictionsOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = FetchProductRestrictionsOperationResult;
