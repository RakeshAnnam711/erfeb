'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents OrderNotificationOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function OrderNotificationOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
OrderNotificationOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = OrderNotificationOperationData;
