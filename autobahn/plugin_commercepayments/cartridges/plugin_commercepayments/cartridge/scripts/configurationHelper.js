'use strict';

/**
 * This script is a helper class to get Commerce Payments configuration.
 */

var PaymentInstrument = require('dw/order/PaymentInstrument');
var SalesforcePaymentsMgr = require('dw/extensions/payments/SalesforcePaymentsMgr');

/**
 * Get Commerce Payments configuration information for the current site.
 * @returns {Object} an object containing configuration information
 */
exports.getConfiguration = function () {
    var configuration;
    if ('getPaymentsSiteConfig' in SalesforcePaymentsMgr) {
        var paymentsSiteConfig = SalesforcePaymentsMgr.paymentsSiteConfig;
        if (paymentsSiteConfig) {
            configuration = {
                expressCheckoutEnabled: paymentsSiteConfig.expressCheckoutEnabled,
                multiStepCheckoutEnabled: paymentsSiteConfig.multiStepCheckoutEnabled,
                cardCaptureAutomatic: false
            };
            if ('cardCaptureAutomatic' in paymentsSiteConfig) {
                configuration.cardCaptureAutomatic = paymentsSiteConfig.cardCaptureAutomatic;
            }
        } else {
            configuration = {
                expressCheckoutEnabled: false,
                multiStepCheckoutEnabled: false,
                cardCaptureAutomatic: false
            };
        }
    } else {
        configuration = {
            expressCheckoutEnabled: true,
            multiStepCheckoutEnabled: true,
            cardCaptureAutomatic: false
        };
    }

    return configuration;
};

/**
 * Returns true if the given basket/order was placed using Commerce Payments checkout, or false
 * if not. The order is considered a Commerce Payments checkout if it has a Payment Intent with
 * a Payment Method, or if it has only Payment Instruments representing gift certificates. Custom
 * cartridges should override this if that test doesn't match their implementation.
 * @param {Object} lineItemCtnr - the dw.order.Basket or dw.order.Order to check
 * @returns {boolean} true if Commerce Payments checkout was used or false if not
 */
exports.commercePaymentsOrder = function (lineItemCtnr) {
    var paymentIntent = SalesforcePaymentsMgr.getPaymentIntent(lineItemCtnr);
    if (paymentIntent && paymentIntent.paymentMethod) {
        // Basket/Order has a payment intent with a payment method
        return true;
    }

    // Check if basket/order has only gift certificate payment instruments
    var paymentInstruments = lineItemCtnr.paymentInstruments.toArray();
    return paymentInstruments.length > 0 && paymentInstruments.every(function (pi) {
        return pi.paymentMethod === PaymentInstrument.METHOD_GIFT_CERTIFICATE;
    });
};

/**
 * Appends Commerce Payments configuration values to controller view data.
 * @param {Object} res - the response from the controller whose view data to which to append configuration
 */
exports.appendConfiguration = function (res) {
    var viewData = res.getViewData();
    viewData.commercePaymentsConfiguration = this.getConfiguration();
    res.setViewData(viewData);
};
