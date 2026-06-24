'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents PayByLinkOrderCancelOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function PayByLinkOrderCancelOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractRequest */
PayByLinkOrderCancelOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = PayByLinkOrderCancelOperationData;
