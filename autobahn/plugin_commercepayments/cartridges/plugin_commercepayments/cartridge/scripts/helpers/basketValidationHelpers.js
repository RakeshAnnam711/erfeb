'use strict';

var base = module.superModule;

var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

/**
 * Validates the payment intent of the basket
 * @param {dw.order.LineItemCtnr} lineItemCtnr - The current user's basket or order
 * @param {boolean} validateAmount - If the payment amount should be validated
 * @returns {Object} an error object
 */
function validatePaymentIntent(lineItemCtnr, validateAmount) {
    var hasPaymentTransactions = lineItemCtnr.paymentInstruments && lineItemCtnr.paymentInstruments.length > 0;
    var paymentIntent = paymentHelpers.getPaymentIntent(lineItemCtnr);
    var paymentInstrument;
    if (paymentIntent) {
        paymentInstrument = paymentIntent.getPaymentInstrument(lineItemCtnr);
    }

    // Check if payment intent exists and has been confirmed
    var confirmed = !hasPaymentTransactions || paymentIntent && paymentInstrument && paymentIntent.confirmed;

    // If necessary, validate the amount of the payment intent matches
    var paymentAmount = paymentHelpers.getPaymentAmount(lineItemCtnr);
    var validAmount = !validateAmount || !paymentIntent || paymentAmount.equals(paymentIntent.amount);

    return {
        error: !confirmed || !validAmount,
        paymentIntent: paymentIntent,
        paymentInstrument: paymentInstrument
    };
}

module.exports = {
    validatePaymentIntent: validatePaymentIntent
};
Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
