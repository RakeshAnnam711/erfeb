'use strict';

/**
 * hook to create signifyd api request payment object
 * @return {Object} an object that contains the signifyd api object
 */
function buildTransaction(paymentInstrument, order) {
    var result =  {
        checkoutPaymentDetails: {
            holderName: order.billingAddress.fullName,
            billingAddress: {
                streetAddress: order.billingAddress.address1,
                unit: order.billingAddress.address2 || '',
                city: order.billingAddress.city,
                provinceCode: order.billingAddress.stateCode,
                postalCode: order.billingAddress.postalCode,
                countryCode: order.billingAddress.countryCode.value.toUpperCase()
            }
        }
    };

    var Calendar = require('dw/util/Calendar');
    var StringUtils = require('dw/util/StringUtils');
    var cal = new Calendar(order.creationDate);
    result.createdAt = StringUtils.formatCalendar(cal, "yyyy-MM-dd'T'HH:mm:ssZ");

    result.gateway = 'Authorize.net';
    result.type = 'AUTHORIZATION';
    result.paymentMethod = 'CREDIT_CARD';
    result.currency = order.currencyCode;

    if (paymentInstrument.paymentTransaction) {
        if (paymentInstrument.paymentTransaction.amount) {
            result.amount = paymentInstrument.paymentTransaction.amount.decimalValue.toString();
        }
        if (paymentInstrument.paymentTransaction.custom.authorizePaymentResult) {
            var authorizeData = JSON.parse(paymentInstrument.paymentTransaction.custom.authorizePaymentResult);
            if (authorizeData && authorizeData.authResponse && authorizeData.authResponse.transactionResponse) {
                authorizeData = authorizeData.authResponse.transactionResponse;
                if (authorizeData.transId) {
                    result.transactionId = authorizeData.transId;
                }
                if (authorizeData.accountNumber) {
                    result.checkoutPaymentDetails.cardLast4 = authorizeData.accountNumber.slice(-4);
                }
                if (authorizeData.avsResultCode) {
                    //https://community.signifyd.com/support/s/article/avs-and-cvv-mapping#adyen_avs_cvv
                    switch (authorizeData.avsResultCode) {
                        case 'B': {
                            result.avsResponseCode = 'U';
                            break;
                        }
                        default: {
                            result.avsResponseCode = authorizeData.avsResultCode;
                        }
                    }
                }
                if (authorizeData.cvvResultCode) {
                    //https://community.signifyd.com/support/s/article/avs-and-cvv-mapping#adyen_avs_cvv
                    result.cvvResponseCode = authorizeData.cvvResultCode;
                }
                if (authorizeData.responseCode) {
                    switch (authorizeData.responseCode) {
                        case '1': {
                            result.gatewayStatusCode = 'SUCCESS'
                            break;
                        }
                        case '2': {
                            result.gatewayStatusCode = 'FAILURE'
                            break;
                        }
                        case '4': {
                            result.gatewayStatusCode = 'PENDING'
                            break;
                        }
                        case '3':
                        default: {
                            result.gatewayStatusCode = 'ERROR';
                            break;
                        }
                    }
                } else {
                    result.gatewayStatusCode = 'ERROR';
                }
            }
        }
    }

    return result;
}

exports.buildTransaction = buildTransaction;
