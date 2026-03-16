'use strict';

var AbstractResponse = require('*/cartridge/models/globale/generic/AbstractResponse');

/**
 * Represents KeepAliveResponse
 * @constructor
 */
function KeepAliveResponse() {
    AbstractResponse.call(this);

    this.success = null;
    this.errorCode = null;
    this.errorMessage = null;
}

/* Inherits AbstractAction */
KeepAliveResponse.prototype = Object.create(AbstractResponse.prototype);

/**
 * Returns response payload
 * @returns {Object} - response payload
 */
KeepAliveResponse.prototype.getPayload = function () {
    return {
        success: this.success,
        errorCode: this.errorCode,
        errorMessage: this.errorMessage
    };
};

module.exports = KeepAliveResponse;
