'use strict';

var AbstractResponse = require('*/cartridge/models/globale/generic/AbstractResponse');
var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

/**
 * Represents OrderClientCreateResponse
 * @constructor
 */
function OrderCreateResponseObject() {
    AbstractResponse.call(this);

    this.sfccOrderNumber = globaleHelpers.consts.orderNo.ORDER_CREATE_BYPASS_NO;
    this.sfccOrderToken = null;
    this.success = true;
    this.errorCode = null;
    this.errorMessage = null;
}

/* Inherits AbstractAction */
OrderCreateResponseObject.prototype = Object.create(AbstractResponse.prototype);

/**
 * Returns response payload
 * @returns {Object} - response payload
 */
OrderCreateResponseObject.prototype.getPayload = function () {
    return {
        n: this.sfccOrderNumber, // SFCC order number
        t: this.sfccOrderToken, // SFCC order token
        s: this.success, // is successfull
        e: this.errorCode, // error code
        m: this.errorMessage // error message
    };
};

module.exports = OrderCreateResponseObject;
