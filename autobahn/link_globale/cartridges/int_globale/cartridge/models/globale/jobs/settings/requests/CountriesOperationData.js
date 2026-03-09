'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents CountriesOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function CountriesOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
CountriesOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = CountriesOperationData;
