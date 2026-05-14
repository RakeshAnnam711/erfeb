'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents ArchiveProductRestrictionFeedOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function ArchiveProductRestrictionFeedOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
ArchiveProductRestrictionFeedOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = ArchiveProductRestrictionFeedOperationData;
