'use strict';

/**
 * Represents abstract action
 * @constructor
 * @param {Object} requestObj - request object
 * @param {Object} responseObj - response object
 */
function AbstractAction(requestObj, responseObj) {
    this.request = requestObj;
    this.response = responseObj;
}

/**
 * Invokes action logic
 * @abstract
 * @throws {Error}
 */
AbstractAction.prototype.run = function () {
    throw new Error('run function must be implemented by subclass!');
};

module.exports = AbstractAction;
