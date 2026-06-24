'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents PaymentRedirectOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function PaymentRedirectOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
PaymentRedirectOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = PaymentRedirectOperationData;
