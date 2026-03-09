'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents CurrencyRatesOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function CurrencyRatesOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
CurrencyRatesOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = CurrencyRatesOperationData;
