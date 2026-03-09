'use strict';

/**
 * hook to create forter api request payment object
 * @return {Object} an object that contains the forter api object
 */
function buildPaymentRequest(authorizePaymentResult, paymentInstrument, order) {
    var isTokenized = false;
    var result =  {};
    var amount = {};
    var ccResult = {};
    var verificationResults = {};
    var paymentGatewayData = {};

    var paymentIntent = dw.extensions.payments.SalesforcePaymentsMgr.getPaymentIntent(order);
    var paymentMethod = '';
    if (paymentIntent) {
        paymentMethod = paymentIntent.paymentMethod;
    }

    if (paymentMethod) {
        if (paymentMethod.brand) {
            ccResult.cardBrand = paymentMethod.brand;
        }
        if (paymentMethod.last4) {
            ccResult.lastFourDigits = paymentMethod.last4;
        }
    }

    paymentGatewayData.authorizationStep = 'authorization';

    if (paymentInstrument) {
        if (paymentInstrument.paymentMethod){
            paymentGatewayData.gatewayName = paymentInstrument.paymentMethod;
        }

        if (paymentInstrument.paymentTransaction) {
            amount.amountLocalCurrency = paymentInstrument.paymentTransaction.amount.decimalValue.toString();
            amount.currency = paymentInstrument.paymentTransaction.amount.currencyCode;

            if (paymentInstrument.paymentTransaction.transactionID) {
                paymentGatewayData.gatewayTransactionId = paymentInstrument.paymentTransaction.transactionID;
                ccResult.token = paymentInstrument.paymentTransaction.transactionID;
            }
        }
    }

    if (Object.keys(amount).length) {
        result.amount = amount;
    }
    if (Object.keys(paymentGatewayData).length) {
        ccResult.paymentGatewayData = paymentGatewayData;
    }
    if (Object.keys(verificationResults).length) {
        ccResult.verificationResults = verificationResults;
    }

    if (Object.keys(ccResult).length) {
        result.tokenizedCard = ccResult
    }

    if (Object.keys(result).length) {
        return result;
    } else {
        return '';
    }
}

exports.buildPaymentRequest = buildPaymentRequest;
