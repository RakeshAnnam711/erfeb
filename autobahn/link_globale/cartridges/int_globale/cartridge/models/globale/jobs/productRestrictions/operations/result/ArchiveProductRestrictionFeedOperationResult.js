'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents ArchiveProductRestrictionFeedOperationResult
 * @constructor
 */
function ArchiveProductRestrictionFeedOperationResult() {
    AbstractOperationResult.call(this);
    this.success = null;
}

/* Inherits AbstractAction */
ArchiveProductRestrictionFeedOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = ArchiveProductRestrictionFeedOperationResult;
