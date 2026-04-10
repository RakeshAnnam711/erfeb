'use strict';

var PaymentTransaction = require('dw/order/PaymentTransaction');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var SalesforcePaymentMethod = require('dw/extensions/payments/SalesforcePaymentMethod');
var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
var configurationHelper = require('~/cartridge/scripts/configurationHelper');
var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

/**
 * Verifies the SalesforcePayments payment intent is confirmed.
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an error object
 */
function Handle(basket, paymentInformation) {   // eslint-disable-line no-unused-vars
    var serverErrors = [];
    var error = false;
    var sfcommercepaymentsapproved = false;

    if (!paymentInformation || !paymentInformation.routeName || paymentInformation.routeName !== 'SubmitBilling') {
        var paymentAmount = paymentHelpers.getPaymentAmount(basket);
        if (paymentAmount.value > 0) {
            var paymentValidation = validationHelpers.validatePaymentIntent(basket);
            if (!paymentValidation.error) {
                Transaction.wrap(function () {
                    var paymentTransaction = paymentValidation.paymentInstrument.paymentTransaction;
                    paymentTransaction.amount = paymentValidation.paymentIntent.amount;
                    paymentTransaction.transactionID = paymentValidation.paymentIntent.ID;
                    var configuration = configurationHelper.getConfiguration();
                    // "Auth" only if manual capture is enabled for credit card payment, everything else
                    // is "Capture".
                    if (paymentValidation.paymentIntent.paymentMethod.type === SalesforcePaymentMethod.TYPE_CARD
                            && configuration.cardCaptureAutomatic === false) {
                        paymentTransaction.type = PaymentTransaction.TYPE_AUTH;
                    } else {
                        paymentTransaction.type = PaymentTransaction.TYPE_CAPTURE;
                    }
                    if (paymentValidation.paymentIntent.paymentMethod && paymentValidation.paymentIntent.paymentMethod.brand) {
                        paymentValidation.paymentInstrument.creditCardType = paymentValidation.paymentIntent.paymentMethod.brand;
                    }
                });
                sfcommercepaymentsapproved = true
            } else {
                error = true;
                serverErrors.push(
                    Resource.msg('error.technical', 'checkout', null)
                );
            }
        }
    }

    return { fieldErrors: {}, serverErrors: serverErrors, error: error, handleViewData: { sfcommercepaymentsapproved: sfcommercepaymentsapproved } };
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    // Stripe was already authorized on client side
    return { authorized: true, error: false, authResponse: {}};
};

exports.Handle = Handle;
exports.Authorize = Authorize;
