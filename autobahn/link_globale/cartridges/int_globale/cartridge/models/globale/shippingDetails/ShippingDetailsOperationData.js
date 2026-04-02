'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents ShippingDetailsOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function ShippingDetailsOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
ShippingDetailsOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = ShippingDetailsOperationData;
