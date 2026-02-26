'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents RestrictedItemsFeedGenerateOperationResult
 * @constructor
 */
function RestrictedItemsFeedGenerateOperationResult() {
    AbstractOperationResult.call(this);
}

/* Inherits AbstractAction */
RestrictedItemsFeedGenerateOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = RestrictedItemsFeedGenerateOperationResult;
