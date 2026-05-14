'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents CulturesOperationResult
 * @constructor
 */
function CulturesOperationResult() {
    AbstractOperationResult.call(this);
    this.success = null;
}

/* Inherits AbstractAction */
CulturesOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = CulturesOperationResult;
