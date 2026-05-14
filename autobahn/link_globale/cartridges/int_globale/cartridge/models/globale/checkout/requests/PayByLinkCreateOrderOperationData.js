'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents PayByLinkCreateOrderOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function PayByLinkCreateOrderOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
PayByLinkCreateOrderOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = PayByLinkCreateOrderOperationData;
