'use strict';

/**
 * Represents abstract response
 * @constructor
 */
function AbstractResponse() {
    this.data = {};
    this.executionNotes = [];
}

/**
 * Adds execution note
 * @param {string} executionNote - execution note
 */
AbstractResponse.prototype.addExecutionNote = function (executionNote) {
    this.executionNotes.push(executionNote);
};

/**
 * Returns execution notes
 * @returns {string} - execution notes
 */
AbstractResponse.prototype.getExecutionNotes = function () {
    return this.executionNotes.length ? this.executionNotes.join(' | ') : null;
};

/**
 * Returns response payload
 * @abstract
 * @throws {Error}
 */
AbstractResponse.prototype.getPayload = function () {
    throw new Error('getPayload function must be implemented by subclass!');
};

module.exports = AbstractResponse;
