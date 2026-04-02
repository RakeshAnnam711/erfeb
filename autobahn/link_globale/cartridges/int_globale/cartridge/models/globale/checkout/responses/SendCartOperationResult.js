'use strict';

var AbstractOperationResult = require('*/cartridge/models/globale/generic/AbstractOperationResult');

/**
 * Represents SendCartOperationResult
 * @constructor
 */
function SendCartOperationResult() {
    AbstractOperationResult.call(this);

    this.basket = null;

    this.success = null;
    this.sendCartData = null;
    this.cartToken = null;
    this.cartHash = null;
    this.sessionId = null;
    this.errorCode = null;
    this.errorMessage = null;
    this.instanceType = require('dw/system/System').instanceType;
}

/* Inherits AbstractAction */
SendCartOperationResult.prototype = Object.create(AbstractOperationResult.prototype);

module.exports = SendCartOperationResult;
