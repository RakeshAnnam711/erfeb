'use strict';

/**
 * hook to create forter api request payment object
 * @return {Object} an object that contains the forter api object
 */
function buildPaymentRequest(authorizePaymentResult, paymentInstrument, order) {
    var result = {};
    var paypal = {};
    var amount = {};

    if (paymentInstrument && paymentInstrument.paymentTransaction) {
        if (paymentInstrument.paymentTransaction.amount.valueOrNull) {
            amount.amountLocalCurrency = paymentInstrument.paymentTransaction.amount.decimalValue.toString();
            amount.currency = paymentInstrument.paymentTransaction.amount.currencyCode;
        }
    }

    if (paymentInstrument && paymentInstrument.custom) {
        if (paymentInstrument.custom.paypalPaymentStatus) {
            paypal.paymentStatus = paymentInstrument.custom.paypalPaymentStatus;
        }
        if (paymentInstrument.custom.paypalOrderID) {
            paypal.correlationId = paymentInstrument.custom.paypalOrderID;
        }
    }

    if (authorizePaymentResult && authorizePaymentResult.authResponse) {
        if (authorizePaymentResult.authResponse.payer && authorizePaymentResult.authResponse.payer.payer_id) {
            paypal.payerId = authorizePaymentResult.authResponse.payer.payer_id;
        }
    }

    if (order) {
        if (order.customerEmail) {
            paypal.payerEmail = order.customerEmail;
        }
    }

    if (Object.keys(paypal).length) {
        result.paypal = paypal
    }
    if (Object.keys(amount).length) {
        result.amount = amount;
    }

    if (Object.keys(result).length) {
        return result;
    } else {
        return '';
    }
}

exports.buildPaymentRequest = buildPaymentRequest;
