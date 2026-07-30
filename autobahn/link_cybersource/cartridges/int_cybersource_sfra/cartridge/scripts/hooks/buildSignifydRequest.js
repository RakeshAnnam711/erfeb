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

    result.gateway = 'Cybersource';
    result.type = 'AUTHORIZATION';
    result.paymentMethod = 'CREDIT_CARD';
    result.currency = order.currencyCode;
    if (paymentInstrument.creditCardExpirationMonth) {
        if (paymentInstrument.creditCardExpirationMonth.toString().length === 1) {
            result.checkoutPaymentDetails.cardExpiryMonth = '0' + paymentInstrument.creditCardExpirationMonth.toString();
        } else {
            result.checkoutPaymentDetails.cardExpiryMonth = paymentInstrument.creditCardExpirationMonth.toString();
        }
    }
    if (paymentInstrument.creditCardExpirationYear) {
        result.checkoutPaymentDetails.cardExpiryYear = paymentInstrument.creditCardExpirationYear;
    }
    if (!paymentInstrument.creditCardToken && session.forms && session.forms.billing && session.forms.billing.creditCardFields && session.forms.billing.creditCardFields.cardNumber && session.forms.billing.creditCardFields.cardNumber.value) {
        result.checkoutPaymentDetails.cardBin = session.forms.billing.creditCardFields.cardNumber.value.substring(0, 6);
    }
    if (paymentInstrument.creditCardNumberLastDigits) {
        result.checkoutPaymentDetails.cardLast4 = paymentInstrument.creditCardNumberLastDigits;
    }

    if (paymentInstrument.paymentTransaction) {
        if (paymentInstrument.paymentTransaction.amount) {
            result.amount = paymentInstrument.paymentTransaction.amount.decimalValue.toString();
        }
        if (paymentInstrument.paymentTransaction.custom.authorizePaymentResult) {
            var cybersourceData = JSON.parse(paymentInstrument.paymentTransaction.custom.authorizePaymentResult);
            if (cybersourceData && cybersourceData.authResponse) {
                cybersourceData = cybersourceData.authResponse;
                if (cybersourceData.avsCode) {
                    // https://community.signifyd.com/support/s/article/avs-and-cvv-mapping
                    switch (cybersourceData.avsCode) {
                        case 'F':
                        case 'L': {
                            result.avsResponseCode = 'Z';
                            break;
                        }
                        case 'H': {
                            result.avsResponseCode = 'Y';
                            break;
                        }
                        case 'T':
                        case 'O': {
                            result.avsResponseCode = 'A';
                            break;
                        }
                        case '1': {
                            result.avsResponseCode = 'S';
                            break;
                        }
                        case '2': {
                            result.avsResponseCode = 'E';
                            break;
                        }
                        case 'K': {
                            result.avsResponseCode = 'N';
                            break;
                        }
                        default: {
                            result.avsResponseCode = cybersourceData.avsCode;
                        }
                    }
                }
                if (cybersourceData.cvCode) {
                    // https://community.signifyd.com/support/s/article/avs-and-cvv-mapping
                    switch (cybersourceData.cvCode) {
                        case 'D':
                        case 'X':
                        case '1': {
                            result.cvvResponseCode = 'U';
                            break;
                        }
                        case 'I':
                        case '2': {
                            result.cvvResponseCode = 'N';
                            break;
                        }
                        case '3': {
                            result.cvvResponseCode = 'P';
                            break;
                        }
                        default: {
                            result.cvvResponseCode = cybersourceData.cvCode;
                            break;
                        }
                    }
                }
                if (cybersourceData.Decision) {
                    //https://developer.cybersource.com/library/documentation/dev_guides/Getting_Started_SO/html/wwhelp/wwhimpl/common/html/wwhelp.htm#href=basics_SO.6.4.html&single=true
                    switch (cybersourceData.Decision) {
                        case 'ACCEPT': {
                            result.gatewayStatusCode = 'SUCCESS';
                            break;
                        }
                        case 'REJECT': {
                            result.gatewayStatusCode = 'FAILURE';
                            break;
                        }
                        case 'REVIEW': {
                            result.gatewayStatusCode = 'PENDING';
                            break;
                        }
                        case 'ERROR':
                        default: {
                            result.gatewayStatusCode = 'ERROR';
                        }
                    }
                }
                if (cybersourceData.RequestID) {
                    result.transactionId = cybersourceData.RequestID;
                }
            }
        }
    }


    return result
}

exports.buildTransaction = buildTransaction;
