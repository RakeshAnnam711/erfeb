'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents ImportProductRestrictionFeedOperationResult
 * @constructor
 */
function ImportProductRestrictionFeedOperationResult() {
    AbstractOperationResult.call(this);
    this.success = null;
}

/* Inherits AbstractAction */
ImportProductRestrictionFeedOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = ImportProductRestrictionFeedOperationResult;
