/*
 * authorizing credit card payment instrument
 * Hook: dw.ocapi.shop.order.authorizeCreditCard
 * Currently used only for subscribe pro
 * */

//NOTE Try to keep this in sync with CheckoutServices-PlaceOrder
exports.authorizeCreditCard = function (order, paymentInstrument, cvn) {
    // Attempt to process the transaction
    var Status = require('dw/system/Status');
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var PaymentManager = require('dw/order/PaymentMgr');

    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var checkoutServicesHelpers = require ('*/cartridge/scripts/helpers/checkoutServicesHelpers');
    var authorizePaymentResult = COHelpers.handlePayments(order, order.orderNo);

    // Call fraud immediately after, regardles of auth result to build profile
    var postAuthFraudCheckResult = checkoutServicesHelpers.placeOrderPostAuthFraudCheck(order, authorizePaymentResult);

    if (authorizePaymentResult.error) {
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        order.custom.ocapiError = "No payment processor configured on SFCC side for payment method " + paymentInstrument.paymentMethod;
        var status = new Status(Status.ERROR, 'payment_error', Resource.msg('error.payment.not.valid', 'checkout', null));
        return status;
    }

    var interpretAuthResults = {};
    for (var i in order.paymentInstruments) {
        var paymentProcessor = PaymentManager.getPaymentMethod(order.paymentInstruments[i].paymentMethod).paymentProcessor.ID.toLowerCase();

        if (authorizePaymentResult[paymentProcessor]) {
            interpretAuthResults[paymentProcessor] = checkoutServicesHelpers.placeOrderHandlePaymentResult(authorizePaymentResult[paymentProcessor], order, paymentProcessor);
            if (interpretAuthResults[paymentProcessor].error) {
                break;
            }
        }
    }

    for (var i in order.paymentInstruments) {
        var paymentProcessor = PaymentManager.getPaymentMethod(order.paymentInstruments[i].paymentMethod).paymentProcessor.ID.toLowerCase();

        var interpretAuthResult = interpretAuthResults[paymentProcessor];
        //important, we never want to leak this data to the client, its filled in by auth call to payment processors
        delete interpretAuthResult.authResponse;

        if (interpretAuthResult.error) {
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            if (!interpretAuthResult.errorMessage) {
                interpretAuthResult.errorMessage = Resource.msg('error.payment.not.valid', 'checkout', null);
            }
            order.custom.ocapiError = interpretAuthResult.errorMessage;
            var status = new Status(Status.ERROR, 'payment_error', interpretAuthResult.errorMessage);
            return status;
        }

        if (interpretAuthResult.returnEarly) {
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            order.custom.ocapiError = 'Payment Processor thinks this is more complicated than a simple authorization which is not supported';
            var status = new Status(Status.ERROR, 'payment_error', 'Payment Processor thinks this is more complicated than a simple authorization which is not supported');
            return status;
        }
    }

    //Auth must have been fine, fallback to fraud result
    if (postAuthFraudCheckResult.error) {
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

        // fraud detection failed
        if (postAuthFraudCheckResult.flagFraud) {
            req.session.privacyCache.set('fraudDetectionStatus', true);
        }

        order.custom.ocapiError = postAuthFraudCheckResult.errorMessage;
        var status = new Status(Status.ERROR, 'payment_error', postAuthFraudCheckResult.errorMessage);
        return status;
    }

    return new Status(Status.OK);
};
