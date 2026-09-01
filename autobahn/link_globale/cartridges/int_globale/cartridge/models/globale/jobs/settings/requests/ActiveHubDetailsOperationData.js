'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents ActiveHubDetailsOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function ActiveHubDetailsOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
ActiveHubDetailsOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = ActiveHubDetailsOperationData;
