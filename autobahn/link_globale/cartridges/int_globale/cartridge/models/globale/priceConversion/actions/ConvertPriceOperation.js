'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents ConvertPriceOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function ConvertPriceOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
ConvertPriceOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Handles ConvertPrice
 * @throws {Error}
 */
ConvertPriceOperation.prototype.run = function () {
    // get converted price
    var convertedPrice = this.convertPrice(this.operationData);
    this.operationResult.convertedPrice = convertedPrice && convertedPrice.toFormattedString();
    this.operationResult.success = !!convertedPrice;
};

module.exports = ConvertPriceOperation;
