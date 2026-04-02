'use strict';

/**
 * default hook if none are registered to create payment object for forter request
 * @return {Object} an object that contains error information
 */
function buildPaymentRequest(authorizePaymentResult, paymentInstrument, order) {
    throw new Error('No hook registered to build forter api request payment object for payment processor ' + paymentInstrument.paymentTransaction.paymentProcessor.ID);
}

exports.buildPaymentRequest = buildPaymentRequest;
