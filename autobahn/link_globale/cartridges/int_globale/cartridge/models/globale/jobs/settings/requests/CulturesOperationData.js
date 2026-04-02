'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents CulturesOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function CulturesOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
CulturesOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = CulturesOperationData;
