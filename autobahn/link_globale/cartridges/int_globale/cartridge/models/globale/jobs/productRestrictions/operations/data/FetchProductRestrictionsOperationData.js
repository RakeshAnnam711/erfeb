'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents FetchProductRestrictionsOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function FetchProductRestrictionsOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
FetchProductRestrictionsOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = FetchProductRestrictionsOperationData;
