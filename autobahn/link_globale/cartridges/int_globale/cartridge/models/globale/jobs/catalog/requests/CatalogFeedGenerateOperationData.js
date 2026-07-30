'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents CatalogFeedGenerateOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function CatalogFeedGenerateOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
CatalogFeedGenerateOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = CatalogFeedGenerateOperationData;
