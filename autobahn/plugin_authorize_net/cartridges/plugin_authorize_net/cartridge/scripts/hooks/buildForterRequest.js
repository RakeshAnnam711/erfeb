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
                if (paymentInstrument.paymentTransaction.custom.avsResultCode) {
                    verificationResults.avsFullResult = paymentInstrument.paymentTransaction.custom.avsResultCode;
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
        if (authorizePaymentResult.authResponse.transactionResponse) {
            if (authorizePaymentResult.authResponse.transactionResponse.cvvResultCode) {
                verificationResults.cvvResult = authorizePaymentResult.authResponse.transactionResponse.cvvResultCode;
            } else {
                verificationResults.cvvResult = '';
            }

            var msg;
            if (authorizePaymentResult.authResponse.transactionResponse.messages && authorizePaymentResult.authResponse.transactionResponse.messages.length) {
                msg = authorizePaymentResult.authResponse.transactionResponse.messages[0];
            } else if (authorizePaymentResult.authResponse.transactionResponse.errors && authorizePaymentResult.authResponse.transactionResponse.errors.length) {
                msg = authorizePaymentResult.authResponse.transactionResponse.errors[0];
            }

            if (msg) {
                verificationResults.processorResponseCode = msg.code;
                verificationResults.processorResponseText = msg.description;
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
