'use strict';

const PayPalExpressModel = require('./payPalExpress');

let that = null;

/**
 * Initiates a PayPalButtonCart model
 * @param {string} payPalBtnSelector A container class where PayPal button will be initiated
 */
function PayPalCartModel(payPalBtnSelector) {
    PayPalExpressModel.call(this, payPalBtnSelector);

    that = this;
}

PayPalCartModel.prototype = Object.create(PayPalExpressModel.prototype);

/**
 * Shows errors if paypal widget was closed with errors for Cart page
 * @param {Object} error - An error object
 */
PayPalCartModel.prototype.onError = function(error) {
    const helper = require('../../helpers/helper');

    if (!helper.handleValidationAddressResult(error) && window.location.href !== window.paypalUrls.cartPage) {
        window.location.href = window.paypalUrls.cartPage;
    }

    if (helper.isInterruptionError(error)) {
        return;
    }

    that.alertHandler.showError(helper.getErrorMessage(error));
};

/**
 * Handles cancelation of the PayPal popup
 */
PayPalCartModel.prototype.onCancel = function() {
    PayPalExpressModel.prototype.onCancel.call();

    // Updates cart page state (shipping method and cart amounts) in case if PayPal or Venmo popup is closed by buyer
    window.location.reload();
};

module.exports = PayPalCartModel;
