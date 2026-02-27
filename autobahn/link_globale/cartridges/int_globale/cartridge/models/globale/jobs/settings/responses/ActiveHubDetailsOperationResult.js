'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents ActiveHubDetailsOperationResult
 * @constructor
 */
function ActiveHubDetailsOperationResult() {
    AbstractOperationResult.call(this);
    this.success = null;
}

/* Inherits AbstractAction */
ActiveHubDetailsOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = ActiveHubDetailsOperationResult;
