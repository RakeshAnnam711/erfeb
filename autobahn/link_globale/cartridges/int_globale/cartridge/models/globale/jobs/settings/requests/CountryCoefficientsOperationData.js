'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents CountryCoefficientsOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function CountryCoefficientsOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
CountryCoefficientsOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = CountryCoefficientsOperationData;
