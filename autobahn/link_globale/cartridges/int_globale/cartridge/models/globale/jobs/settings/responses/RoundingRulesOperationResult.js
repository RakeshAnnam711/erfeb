'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents RoundingRulesOperationResult
 * @constructor
 */
function RoundingRulesOperationResult() {
    AbstractOperationResult.call(this);
    this.success = null;
}

/* Inherits AbstractAction */
RoundingRulesOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = RoundingRulesOperationResult;
