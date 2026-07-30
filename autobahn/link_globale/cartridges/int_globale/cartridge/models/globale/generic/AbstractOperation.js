'use strict';

/**
 * Represents abstract operation
 * @constructor
 * @param {Object} operationData - operation data object
 * @param {Object} operationResult - operation result object
 */
function AbstractOperation(operationData, operationResult) {
    this.operationData = operationData;
    this.operationResult = operationResult;
}

/**
 * Invokes operation logic
 * @abstract
 * @throws {Error}
 */
AbstractOperation.prototype.run = function () {
    throw new Error('run function must be implemented by subclass!');
};

module.exports = AbstractOperation;
