'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents ImportProductRestrictionFeedOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function ImportProductRestrictionFeedOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
ImportProductRestrictionFeedOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = ImportProductRestrictionFeedOperationData;
