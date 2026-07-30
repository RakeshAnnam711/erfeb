'use strict';

/**
 * Places the given order.
 * @param {dw.order.Order} order - order whose payment succeeded
 * @return {dw.system.Status} returns status of the hook handling
 */
function asyncPaymentSucceeded(order) {
    var OrderMgr = require('dw/order/OrderMgr');
    var PaymentTransaction = require('dw/order/PaymentTransaction');
    var Status = require('dw/system/Status');
    var Transaction = require('dw/system/Transaction');
    var SalesforcePaymentMethod = require('dw/extensions/payments/SalesforcePaymentMethod');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');

    // Verify the payment
    var paymentValidation = validationHelpers.validatePaymentIntent(order, false);
    if (!paymentValidation.error) {
        Transaction.wrap(function () {
            var paymentTransaction = paymentValidation.paymentInstrument.paymentTransaction;
            paymentTransaction.amount = paymentValidation.paymentIntent.amount;
            paymentTransaction.transactionID = paymentValidation.paymentIntent.ID;
            if (paymentValidation.paymentIntent.paymentMethod.type === SalesforcePaymentMethod.TYPE_CARD) {
                paymentTransaction.type = PaymentTransaction.TYPE_AUTH;
            } else {
                paymentTransaction.type = PaymentTransaction.TYPE_CAPTURE;
            }
        });
    } else {
        OrderMgr.failOrder(order, true);
        return new Status(Status.ERROR);
    }

    // Handles payment authorization
    //TODO BEN how does this trigger? It needs to be synced with the authorize/handle hooks and perhaps even COHelpers.handlePayment()
    //TODO BEN not to mention the entirety of CheckoutServices-PlaceOrder for fraud and such :(
    var handlePaymentResult = COHelpers.handleCommercePayments(order); //COHelpers.handlePayments(order);
    if (handlePaymentResult.error) {
        return new Status(Status.ERROR);
    }

    // Places the order
    var placeOrderResult = COHelpers.placeOrder(order);
    if (placeOrderResult.error) {
        return new Status(Status.ERROR);
    }

    COHelpers.sendConfirmationEmail(order, order.customerLocaleID);

    return new Status(Status.OK);
}

exports.asyncPaymentSucceeded = asyncPaymentSucceeded;
