'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents CachePriceBooksGenerateOperationResult
 * @constructor
 */
function CachePriceBooksGenerateOperationResult() {
    AbstractOperationResult.call(this);
}

/* Inherits AbstractAction */
CachePriceBooksGenerateOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = CachePriceBooksGenerateOperationResult;
