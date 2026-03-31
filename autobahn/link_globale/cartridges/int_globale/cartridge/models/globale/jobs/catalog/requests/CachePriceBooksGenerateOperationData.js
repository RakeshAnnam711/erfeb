'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents CachePriceBooksGenerateOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function CachePriceBooksGenerateOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
CachePriceBooksGenerateOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = CachePriceBooksGenerateOperationData;
