'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents OrderDetailsOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function OrderDetailsOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
OrderDetailsOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = OrderDetailsOperationData;
