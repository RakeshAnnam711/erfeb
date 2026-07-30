'use strict';

var AbstractResponse = require('*/cartridge/models/globale/generic/AbstractResponse');

/**
 * Represents ValidateCartResponse
 * @constructor
 */
function ValidateCartResponse() {
    AbstractResponse.call(this);

    this.amendedProducts = [];
    this.reservationRequestId = null;
    this.errorCode = null;
    this.errorMessage = null;
    this.titleTextResourceId = null;
    this.bodyTextResourceId = null;
    this.buttonTextResourceId = null;
    this.redirectUrl = null;
    this.textResourcesPlaceholders = {};
}

/* Inherits AbstractAction */
ValidateCartResponse.prototype = Object.create(AbstractResponse.prototype);

/**
 * Returns response payload
 * @returns {Object} - response payload
 */
ValidateCartResponse.prototype.getPayload = function () {
    return {
        AmendedProducts: this.amendedProducts, // array
        Error: this.errorCode, // string
        StackTrace: this.errorMessage, // string
        ReservationRequestId: this.reservationRequestId, // string
        CustomResources: {
            TitleTextResourceId: this.titleTextResourceId, // string
            BodyTextResourceId: this.bodyTextResourceId, // string
            ButtonTextResourceId: this.buttonTextResourceId, // string
            RedirectUrl: this.redirectUrl // string
        },
        TextResourcesPlaceholders: this.textResourcesPlaceholders // object
    };
};

module.exports = ValidateCartResponse;
