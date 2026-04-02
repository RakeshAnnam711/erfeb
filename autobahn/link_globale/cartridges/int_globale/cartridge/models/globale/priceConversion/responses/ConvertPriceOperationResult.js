'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents ConvertPriceOperationResult
 * @constructor
 */
function ConvertPriceOperationResult() {
    AbstractOperationResult.call(this);

    this.success = null;
    this.convertedPrice = null;
}

/* Inherits AbstractAction */
ConvertPriceOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = ConvertPriceOperationResult;
