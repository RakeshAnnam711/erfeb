'use strict';

var AbstractResponse = require('*/cartridge/models/globale/generic/AbstractResponse');

/**
 * Represents OrderSendToMerchantResponse
 * @constructor
 */
function OrderSendToMerchantResponse() {
    AbstractResponse.call(this);

    this.data.orders = [];

    this.sfccOrderNumber = null;
    this.success = false;
    this.errorCode = null;
    this.errorMessage = null;
}

/* Inherits AbstractAction */
OrderSendToMerchantResponse.prototype = Object.create(AbstractResponse.prototype);

/**
 * Returns response payload
 * @returns {Object} - response payload
 */
OrderSendToMerchantResponse.prototype.getPayload = function () {
    return {
        InternalOrderId: this.sfccOrderNumber,
        OrderId: this.sfccOrderNumber,
        Success: this.success,
        ErrorCode: this.errorCode,
        Message: this.errorMessage,
        Description: this.getExecutionNotes()
    };
};

module.exports = OrderSendToMerchantResponse;
