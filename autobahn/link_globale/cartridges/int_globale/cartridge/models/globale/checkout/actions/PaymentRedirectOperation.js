'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents PaymentRedirectOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function PaymentRedirectOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
PaymentRedirectOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Triggers Error
 * @param {string} errorCode - operation data
 * @param {string} errorMessage - result object
 * @throws {Error}
 */
PaymentRedirectOperation.prototype.triggerError = function (errorCode, errorMessage) {
    this.operationResult.success = false;
    this.operationResult.errorCode = errorCode;
    this.operationResult.errorMessage = errorMessage;

    throw Error(this.operationResult.errorMessage);
};

/**
 * Handles PaymentRedirect
 * @throws {Error}
 */
PaymentRedirectOperation.prototype.run = function () {
    var globaleRequest = require('*/cartridge/models/globale/request');

    var httpParameterMap = globaleRequest.get('httpParameterMap');

    // check cart token
    this.operationResult.cartToken = httpParameterMap.isParameterSubmitted('token') && httpParameterMap.token.stringValue;
    var httpCookies = request.httpCookies;
    if (!this.operationResult.cartToken && session.privacy.geCartToken) {
        this.operationResult.cartToken = session.privacy.geCartToken;
    } else if (!this.operationResult.cartToken && httpCookies && httpCookies.GlobalE_Cart_Token) {
        this.operationResult.cartToken = httpCookies.GlobalE_Cart_Token.getValue();
    }

    // check error message
    var pdErrorCode = httpParameterMap.isParameterSubmitted('errorCode') && httpParameterMap.errorCode.rawValue;
    if (pdErrorCode) {
        this.triggerError(106, 'Payment redirect error: ' + globaleRequest.get('httpQueryString'));
    }

    this.operationResult.success = true;
};

module.exports = PaymentRedirectOperation;
