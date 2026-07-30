'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents CountryCoefficientsOperationResult
 * @constructor
 */
function CountryCoefficientsOperationResult() {
    AbstractOperationResult.call(this);
    this.success = null;
}

/* Inherits AbstractAction */
CountryCoefficientsOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = CountryCoefficientsOperationResult;
