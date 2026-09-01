'use strict';

var AbstractResponse = require('*/cartridge/models/globale/generic/AbstractResponse');

/**
 * Represents OrderRmaResponseObject
 * @constructor
 */
function OrderRmaResponseObject() {
    AbstractResponse.call(this);

    this.sfccOrderNumber = null;
    this.success = false;
    this.errorCode = null;
    this.errorMessage = null;
    this.errorDescription = null;
}

/* Inherits AbstractAction */
OrderRmaResponseObject.prototype = Object.create(AbstractResponse.prototype);

/**
 * Returns response payload
 * @returns {Object} - response payload
 */
OrderRmaResponseObject.prototype.getPayload = function () {
    return {
        InternalOrderId: this.sfccOrderNumber, // SFCC order ID
        OrderId: this.sfccOrderNumber, // SFCC order ID
        Success: this.success, // is successfull
        ErrorCode: this.errorCode, // error code
        Message: this.errorMessage, // error message
        Description: this.errorDescription // description message
    };
};

module.exports = OrderRmaResponseObject;
