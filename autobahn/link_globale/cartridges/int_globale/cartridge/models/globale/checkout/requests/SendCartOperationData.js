'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents SendCartOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function SendCartOperationData(data) {
    AbstractOperationData.call(this, data);
    this.enableCartTokenCache = false;
}

/* Inherits AbstractOperationData */
SendCartOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = SendCartOperationData;
