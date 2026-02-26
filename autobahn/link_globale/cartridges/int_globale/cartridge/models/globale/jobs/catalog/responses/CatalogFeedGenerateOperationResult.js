'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents CatalogFeedGenerateOperationResult
 * @constructor
 */
function CatalogFeedGenerateOperationResult() {
    AbstractOperationResult.call(this);
}

/* Inherits AbstractAction */
CatalogFeedGenerateOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = CatalogFeedGenerateOperationResult;
