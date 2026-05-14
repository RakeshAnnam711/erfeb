'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents CurrenciesOperationResult
 * @constructor
 */
function CurrenciesOperationResult() {
    AbstractOperationResult.call(this);
    this.success = null;
}

/* Inherits AbstractAction */
CurrenciesOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = CurrenciesOperationResult;
