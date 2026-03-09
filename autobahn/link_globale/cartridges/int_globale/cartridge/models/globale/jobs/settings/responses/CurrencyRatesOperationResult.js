'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents CurrencyRatesOperationResult
 * @constructor
 */
function CurrencyRatesOperationResult() {
    AbstractOperationResult.call(this);
    this.success = null;
}

/* Inherits AbstractAction */
CurrencyRatesOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = CurrencyRatesOperationResult;
