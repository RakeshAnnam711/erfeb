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

    var paymentIntent = dw.extensions.payments.SalesforcePaymentsMgr.getPaymentIntent(order);
    var paymentMethod = '';
    if (paymentIntent) {
        paymentMethod = paymentIntent.paymentMethod;
    }

    var Calendar = require('dw/util/Calendar');
    var StringUtils = require('dw/util/StringUtils');
    var cal = new Calendar(order.creationDate);
    result.createdAt = StringUtils.formatCalendar(cal, "yyyy-MM-dd'T'HH:mm:ssZ");

    result.gateway = paymentInstrument.paymentMethod;
    result.gatewayStatusCode = 'SUCCESS';
    result.type = 'AUTHORIZATION';
    result.paymentMethod = 'CREDIT_CARD';
    result.currency = order.currencyCode;

    if (paymentMethod.last4) {
        result.checkoutPaymentDetails.cardLast4 = paymentMethod.last4;
    }

    if (paymentInstrument.paymentTransaction) {
        if (paymentInstrument.paymentTransaction.amount) {
            result.amount = paymentInstrument.paymentTransaction.amount.decimalValue.toString();
        }
        if (paymentInstrument.paymentTransaction.transactionID){
            result.transactionId = paymentInstrument.paymentTransaction.transactionID;
        }
    }


    return result;
}

exports.buildTransaction = buildTransaction;
