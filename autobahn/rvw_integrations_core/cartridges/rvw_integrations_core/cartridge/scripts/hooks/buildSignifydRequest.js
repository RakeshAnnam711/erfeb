'use strict';

/**
 * hook to create signifyd api request payment object
 * @return {Object} an object that contains the signifyd api object
 */
function buildTransaction(paymentInstrument, order) {
    var result = {};

    var Calendar = require('dw/util/Calendar');
    var StringUtils = require('dw/util/StringUtils');
    var cal = new Calendar(order.creationDate);
    result.createdAt = StringUtils.formatCalendar(cal, "yyyy-MM-dd'T'HH:mm:ssZ");

    result.transactionId = paymentInstrument.UUID;
    result.gatewayStatusCode = 'SUCCESS';
    result.gateway = paymentInstrument.paymentMethod;
    result.type = 'AUTHORIZATION';
    result.paymentMethod = 'GIFT_CARD';
    result.currency = order.currencyCode;
    if (paymentInstrument.paymentTransaction) {
        if (paymentInstrument.paymentTransaction.amount) {
            result.amount = paymentInstrument.paymentTransaction.amount.decimalValue.toString();
        }
    }

    return result;
}

exports.buildTransaction = buildTransaction;
