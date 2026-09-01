'use strict';

var AbstractResponse = require('*/cartridge/models/globale/generic/AbstractResponse');

/**
 * Represents VoidReservationResponse
 * @constructor
 */
function VoidReservationResponse() {
    AbstractResponse.call(this);

    this.success = false;
    this.errorCode = null;
    this.errorMessage = null;
    this.errorDescription = null;
}

/* Inherits AbstractAction */
VoidReservationResponse.prototype = Object.create(AbstractResponse.prototype);

/**
 * Returns response payload
 * @returns {Object} - response payload
 */
VoidReservationResponse.prototype.getPayload = function () {
    return {
        Success: this.success, // is successfull
        ErrorCode: this.errorCode, // error code
        Message: this.errorMessage, // error message
        Description: this.errorDescription // description message
    };
};

module.exports = VoidReservationResponse;
