'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents CatalogFeedUploadOperationResult
 * @constructor
 */
function CatalogFeedUploadOperationResult() {
    AbstractOperationResult.call(this);
    this.success = null;
}

/* Inherits AbstractAction */
CatalogFeedUploadOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = CatalogFeedUploadOperationResult;
