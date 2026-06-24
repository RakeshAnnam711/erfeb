'use strict';

function aggregateRedundantKeys(_object) {
    function set(object, property, value) {
        var index = property.indexOf('.');
        if (index >= 0) {
            var branch = property.substring(0, index);
            var leaf = property.substring(index + 1);
            if (!object.hasOwnProperty(branch)) {
                object[branch] = {};
            }
            set(object[branch], leaf, value);
        } else {
            object[property] = value;
        }
    }

    var result = {};
    Object.keys(_object).forEach(function (property) {
        set(result, property, _object[property]);
    });

    return result;
}

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

    result.gateway = 'Adyen';
    result.type = 'AUTHORIZATION';
    result.paymentMethod =  order.paymentInstrument.paymentMethod === 'CREDIT_CARD' ? order.paymentInstrument.paymentMethod: order.paymentInstrument.custom.adyenPaymentMethod;
    result.currency = order.currencyCode;
    if (paymentInstrument.paymentTransaction) {
        if (paymentInstrument.paymentTransaction.amount) {
            result.amount = paymentInstrument.paymentTransaction.amount.decimalValue.toString();
        }

        var adyenData = null;
        var additionalData = null;

        // New payload format
        if (paymentInstrument.paymentTransaction.custom.Adyen_log) {
            adyenData = JSON.parse(paymentInstrument.paymentTransaction.custom.Adyen_log);
            adyenData = aggregateRedundantKeys(adyenData);
            additionalData = adyenData && adyenData.additionalData;
        // Previous payload format
        } else if (paymentInstrument.paymentTransaction.custom.authorizePaymentResult) {
            adyenData = JSON.parse(paymentInstrument.paymentTransaction.custom.authorizePaymentResult);
            if (adyenData && adyenData.authResponse) {
                adyenData = adyenData.authResponse;
                if (adyenData.fullResponse && adyenData.fullResponse.additionalData) {
                    additionalData = adyenData.fullResponse.additionalData;
                }
            }
        }

        if (additionalData) {
            if (additionalData.cardBin) {
                result.checkoutPaymentDetails.cardBin = additionalData.cardBin;
            }
            if (additionalData.cardSummary) {
                result.checkoutPaymentDetails.cardLast4 = additionalData.cardSummary;
            }
            if (additionalData.expiryDate) {
                var parts = additionalData.expiryDate.split('/');
                if (parts.length === 2) {
                    var month = parts[0];
                    if (month.length === 1) {
                        result.checkoutPaymentDetails.cardExpiryMonth = '0' + month;
                    } else {
                        result.checkoutPaymentDetails.cardExpiryMonth = month;
                    }

                    result.checkoutPaymentDetails.cardExpiryYear = parts[1];
                }
            }
            // https://docs.adyen.com/risk-management/avs-checks#avs-mapping-table
            // https://community.signifyd.com/support/s/article/avs-and-cvv-mapping#adyen_avs_cvv
            result.avsResponseCode = null;
            if (additionalData.avsResultRaw) {
                switch (additionalData.avsResultRaw) {
                    case '1':
                    case '9':
                    case '12':
                    case '21':
                    case '25': {
                        result.avsResponseCode = 'A';
                        break;
                    }
                    case '2':
                    case '10':
                    case '13':
                    case '16':
                    case '17':
                    case '22':
                    case '26': {
                        result.avsResponseCode = 'N';
                        break;
                    }
                    case '3':
                    case '18': {
                        result.avsResponseCode = 'U';
                        break;
                    }
                    case '4': {
                        result.avsResponseCode = 'S';
                        break;
                    }
                    case '6':
                    case '14':
                    case '15':
                    case '19':
                    case '23': {
                        result.avsResponseCode = 'Z';
                        break;
                    }
                    case '7':
                    case '20':
                    case '24': {
                        result.avsResponseCode = 'Y';
                        break;
                    }
                    case '-1':
                    case '0':
                    case '8':
                    case '11':
                    default : {
                        break;
                    }
                }
            }
            if (additionalData.cvcResultRaw) {
                if (isNaN(additionalData.cvcResultRaw)) {
                    result.cvvResponseCode = additionalData.cvcResultRaw;
                }
            }

            if (additionalData.cvcResult) {
                // https://docs.adyen.com/development-resources/test-cards/cvc-cvv-result-testing
                var cvvResponse = (additionalData.cvcResult) + '';

                //https://community.signifyd.com/support/s/article/avs-and-cvv-mapping?language=en_US#adyen_avs_cvv
                switch (cvvResponse.charAt(0)) {
                    case '1':
                        result.cvvResponseCode = 'M';
                        break;

                    case '2':
                        result.cvvResponseCode = 'N';
                        break;

                    case '3':
                        result.cvvResponseCode = 'P';
                        break;

                    case '4':
                        result.cvvResponseCode = 'S';
                        break;

                    case '5':
                        result.cvvResponseCode = 'U';
                        break;

                    case '0':
                    case '6':
                    default: {
                        result.cvvResponseCode = null;
                    }
                }
            }
        }

        if (adyenData) {
            var fullResponse = adyenData.fullResponse || adyenData;
            if (adyenData.decision) {
                //only non 3DS has this
                switch (adyenData.decision) {
                    case 'ACCEPT': {
                        result.gatewayStatusCode = 'SUCCESS';
                        break;
                    }
                    case 'REFUSE': {
                        result.gatewayStatusCode = 'FAILURE';
                        break;
                    }
                    case 'ERROR':
                    default: {
                        result.gatewayStatusCode = 'ERROR';
                    }
                }
            } else if (fullResponse.resultCode) {
                // Taken from unused code in adyenCheckout.js that "looks" appropriate for 3DS2 transactions
                switch (fullResponse.resultCode) {
                    case 'IdentifyShopper':
                    case 'ChallengeShopper':
                    case 'Authorised':
                    case 'RedirectShopper':
                    case 'PresentToShopper':
                    case 'Received': {
                        result.gatewayStatusCode = 'SUCCESS';
                        break;
                    }
                    default: {
                        result.gatewayStatusCode = 'FAILURE';
                    }
                }
            } else if (['AUTHORISATION', 'ORDER_CLOSED', 'MANUAL_REVIEW_ACCEPT'].includes(adyenData.eventCode)) {
                result.gatewayStatusCode = adyenData.success === 'true' ? 'SUCCESS' : 'FAILURE';
            }

            if (fullResponse && fullResponse.pspReference) {
                result.transactionId = fullResponse.pspReference;
            }
        }
    }

    return result;
}

exports.buildTransaction = buildTransaction;
