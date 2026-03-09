'use strict';

var AbstractOperationData = require('*/cartridge/models/globale/generic/AbstractOperationData');

/**
 * Represents AppSettingsOperationData
 * @constructor
 * @param {Object} data - operation data
 */
function AppSettingsOperationData(data) {
    AbstractOperationData.call(this, data);
}

/* Inherits AbstractOperationData */
AppSettingsOperationData.prototype = Object.create(AbstractOperationData.prototype);

module.exports = AppSettingsOperationData;
