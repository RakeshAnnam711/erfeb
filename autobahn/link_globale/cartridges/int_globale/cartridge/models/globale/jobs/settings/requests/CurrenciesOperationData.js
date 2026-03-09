'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents CurrenciesOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function CurrenciesOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
CurrenciesOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = CurrenciesOperationData;
