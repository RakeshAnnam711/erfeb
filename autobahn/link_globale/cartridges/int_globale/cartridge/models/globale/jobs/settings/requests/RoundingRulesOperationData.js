'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents RoundingRulesOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function RoundingRulesOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
RoundingRulesOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = RoundingRulesOperationData;
