'use strict';

/**
 * default hook if none are registered to create payment object for forter request
 * @return {Object} an object that contains error information
 */
function buildTransaction(authorizePaymentResult, paymentInstrument, order) {
    throw new Error('No hook registered to build signifyd api request transaction for payment processor ' + paymentInstrument.paymentTransaction.paymentProcessor.ID);
}

exports.buildTransaction = buildTransaction;
