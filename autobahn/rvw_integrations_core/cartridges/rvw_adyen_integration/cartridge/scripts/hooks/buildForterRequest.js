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
        } else {
            if (authorizePaymentResult && authorizePaymentResult.authResponse && authorizePaymentResult.authResponse.fullResponse && authorizePaymentResult.authResponse.fullResponse.additionalData && authorizePaymentResult.authResponse.fullResponse.additionalData.cardBin) {
                ccResult.bin = authorizePaymentResult.authResponse.fullResponse.additionalData.cardBin;
            }
        }
        if (paymentInstrument.creditCardType) {
            ccResult.cardBrand = paymentInstrument.creditCardType;
        }
        if (paymentInstrument.creditCardNumberLastDigits) {
            ccResult.lastFourDigits = paymentInstrument.creditCardNumberLastDigits;
        }
        if (paymentInstrument.paymentTransaction) {
            amount.amountLocalCurrency = paymentInstrument.paymentTransaction.amount.decimalValue.toString();
            amount.currency = paymentInstrument.paymentTransaction.amount.currencyCode;

            if (paymentInstrument.paymentTransaction.paymentProcessor) {
                if (paymentInstrument.paymentTransaction.paymentProcessor.ID) {
                    paymentGatewayData.gatewayName = paymentInstrument.paymentTransaction.paymentProcessor.ID;
                }
            }
        }
    }
    if (authorizePaymentResult) {
        if (authorizePaymentResult.authResponse) {
            if (authorizePaymentResult.authResponse.fullResponse) {
                if (authorizePaymentResult.authResponse.fullResponse.additionalData) {
                    var additionalData = authorizePaymentResult.authResponse.fullResponse.additionalData;
                    if (additionalData.cardHolderName) {
                        ccResult.nameOnCard = additionalData.cardHolderName
                    }
                    if (additionalData.avsResultRaw) {
                        verificationResults.avsFullResult = additionalData.avsResultRaw;
                    }
                    if (additionalData.cvcResultRaw) {
                        verificationResults.cvvResult = additionalData.cvcResultRaw;
                    }
                    if (additionalData.authCode) {
                        verificationResults.authorizationCode = additionalData.authCode;
                    }
                    if (additionalData.expiryDate) {
                        var monthyear = additionalData.expiryDate.split('/');
                        if (monthyear.length == 2) {
                            if (monthyear[0].length === 1) {
                                ccResult.expirationMonth = '0' + monthyear[0];
                            } else {
                                ccResult.expirationMonth = monthyear[0];
                            }
                            ccResult.expirationYear = monthyear[1];
                        }
                    }
                }
                if (authorizePaymentResult.authResponse.fullResponse.resultCode) {
                    verificationResults.processorResponseCode = authorizePaymentResult.authResponse.fullResponse.resultCode;
                }
            }
            if (authorizePaymentResult.authResponse.adyenErrorMessage) {
                verificationResults.processorResponseText = authorizePaymentResult.authResponse.adyenErrorMessage;
            }
            if (authorizePaymentResult.authResponse.pspReference) {
                paymentGatewayData.gatewayTransactionId = authorizePaymentResult.authResponse.pspReference;
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
