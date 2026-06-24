'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents AppSettingsOperationResult
 * @constructor
 */
function AppSettingsOperationResult() {
    AbstractOperationResult.call(this);
    this.success = null;
}

/* Inherits AbstractAction */
AppSettingsOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = AppSettingsOperationResult;
