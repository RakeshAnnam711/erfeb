'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents RestrictedItemsFeedUploadOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function RestrictedItemsFeedUploadOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
RestrictedItemsFeedUploadOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = RestrictedItemsFeedUploadOperationData;
