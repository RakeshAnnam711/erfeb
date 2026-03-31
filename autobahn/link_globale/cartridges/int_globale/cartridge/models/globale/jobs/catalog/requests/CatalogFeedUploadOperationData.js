'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents CatalogFeedUploadOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function CatalogFeedUploadOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
CatalogFeedUploadOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = CatalogFeedUploadOperationData;
