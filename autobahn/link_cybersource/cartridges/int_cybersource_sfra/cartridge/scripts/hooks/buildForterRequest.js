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

    if (paymentInstrument) {
        if (paymentInstrument.creditCardToken) {
            isTokenized = true;
            ccResult.token = paymentInstrument.creditCardToken;
        } else if (session && session.forms && session.forms.billing && session.forms.billing.creditCardFields && session.forms.billing.creditCardFields.cardNumber && session.forms.billing.creditCardFields.cardNumber.value) {
            ccResult.bin = session.forms.billing.creditCardFields.cardNumber.value.substring(0, 6);
        }

        if (paymentInstrument.creditCardExpirationMonth) {
            if (paymentInstrument.creditCardExpirationMonth.toString().length === 1) {
                ccResult.expirationMonth = '0' + paymentInstrument.creditCardExpirationMonth.toString();
            } else {
                ccResult.expirationMonth = paymentInstrument.creditCardExpirationMonth.toString();
            }
        }
        if (paymentInstrument.creditCardHolder) {
            ccResult.nameOnCard = paymentInstrument.creditCardHolder;
        }
        if (paymentInstrument.creditCardType) {
            ccResult.cardBrand = paymentInstrument.creditCardType;
        }
        if (paymentInstrument.creditCardNumberLastDigits) {
            ccResult.lastFourDigits = paymentInstrument.creditCardNumberLastDigits;
        }
        if (paymentInstrument.creditCardExpirationYear) {
            ccResult.expirationYear = paymentInstrument.creditCardExpirationYear.toString();
        }
        if (paymentInstrument.paymentTransaction) {
            amount.amountLocalCurrency = paymentInstrument.paymentTransaction.amount.decimalValue.toString();
            amount.currency = paymentInstrument.paymentTransaction.amount.currencyCode;

            if (paymentInstrument.paymentTransaction.custom) {
                if (paymentInstrument.paymentTransaction.custom.authCode) {
                    verificationResults.authorizationCode = paymentInstrument.paymentTransaction.custom.authCode;
                }
            }
            if (paymentInstrument.paymentTransaction.paymentProcessor) {
                if (paymentInstrument.paymentTransaction.paymentProcessor.ID) {
                    paymentGatewayData.gatewayName = paymentInstrument.paymentTransaction.paymentProcessor.ID;
                }
            }
            if (paymentInstrument.paymentTransaction.transactionID) {
                paymentGatewayData.gatewayTransactionId = paymentInstrument.paymentTransaction.transactionID;
            }
        }
    }
    if (authorizePaymentResult && authorizePaymentResult.authResponse) {
        if (authorizePaymentResult.authResponse.avsCode) {
            verificationResults.avsFullResult = authorizePaymentResult.authResponse.avsCode;
        }
        if (authorizePaymentResult.authResponse.cvCode) {
            verificationResults.cvvResult = authorizePaymentResult.authResponse.cvCode;
        }
        if (authorizePaymentResult.authResponse.Decision) {
            verificationResults.processorResponseText = authorizePaymentResult.authResponse.Decision;
        }
        if (authorizePaymentResult.authResponse.ReasonCode) {
            verificationResults.processorResponseCode = authorizePaymentResult.authResponse.ReasonCode.toString();
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
        if (isTokenized) {
            result.tokenizedCard = ccResult

        } else {
            result.creditCard = ccResult
        }
    }

    if (Object.keys(result).length) {
        return result;
    } else {
        return '';
    }
}

exports.buildPaymentRequest = buildPaymentRequest;
