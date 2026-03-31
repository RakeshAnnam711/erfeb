'use strict';

var AbstractAction = require('*/cartridge/models/globale/generic/AbstractAction');

/**
 * Represents ValidateCartAction
 * @constructor
 * @param {Object} requestObj - request object
 * @param {Object} responseObj - response object
 */
function ValidateCartAction(requestObj, responseObj) {
    AbstractAction.call(this, requestObj, responseObj);
}

/* Inherits AbstractAction */
ValidateCartAction.prototype = Object.create(AbstractAction.prototype);

/**
 * Creates order from customer basket
 * @throws {Error}
 */
ValidateCartAction.prototype.run = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    try {
        var validateCartResult = globaleHooksHelper.invokeCustomHookWithException(globaleHelpers.hooks.checkout.validateCart, this.request.payload, this.request.isPayByLinkScenario);
        this.response.amendedProducts = validateCartResult.amendedProducts;
        this.response.reservationRequestId = validateCartResult.reservationRequestId;
        this.response.errorCode = validateCartResult.errorCode;
        this.response.errorMessage = validateCartResult.errorMessage;
        this.response.titleTextResourceId = validateCartResult.titleTextResourceId;
        this.response.bodyTextResourceId = validateCartResult.bodyTextResourceId;
        this.response.buttonTextResourceId = validateCartResult.buttonTextResourceId;
        this.response.redirectUrl = validateCartResult.redirectUrl;
        this.response.textResourcesPlaceholders = validateCartResult.textResourcesPlaceholders;
    } catch (e) {
        this.response.amendedProducts = [];
        throw e;
    }
};

module.exports = ValidateCartAction;
