'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents RestrictedItemsFeedGenerateOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function RestrictedItemsFeedGenerateOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
RestrictedItemsFeedGenerateOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = RestrictedItemsFeedGenerateOperationData;
