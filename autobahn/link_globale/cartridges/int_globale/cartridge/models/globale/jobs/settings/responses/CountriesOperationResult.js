'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents CountriesOperationResult
 * @constructor
 */
function CountriesOperationResult() {
    AbstractOperationResult.call(this);
    this.success = null;
}

/* Inherits AbstractAction */
CountriesOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = CountriesOperationResult;
