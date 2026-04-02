'use strict';

var AbstractResponse = require('*/cartridge/models/globale/generic/AbstractResponse');

/**
 * Represents OrderPaymentResponseObject
 * @constructor
 */
function OrderPaymentResponseObject() {
    AbstractResponse.call(this);

    this.data.orders = [];

    this.sfccOrderNumber = null;
    this.success = false;
    this.errorCode = null;
    this.errorMessage = null;
    this.errorDescription = null;
}

/* Inherits AbstractAction */
OrderPaymentResponseObject.prototype = Object.create(AbstractResponse.prototype);

/**
 * Returns response payload
 * @returns {Object} - response payload
 */
OrderPaymentResponseObject.prototype.getPayload = function () {
    return {
        InternalOrderId: this.sfccOrderNumber, // SFCC order ID
        OrderId: this.sfccOrderNumber, // SFCC order ID
        Success: this.success, // is successfull
        ErrorCode: this.errorCode, // error code
        Message: this.errorMessage, // error message
        Description: this.errorDescription // description message
    };
};

module.exports = OrderPaymentResponseObject;
