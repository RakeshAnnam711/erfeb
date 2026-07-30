'use strict';

var base = module.superModule;
var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

/**
 * Creates an array of objects containing selected payment information
 * @param {dw.util.ArrayList<dw.order.PaymentInstrument>} selectedPaymentInstruments - ArrayList
 *      of payment instruments that the user is using to pay for the current basket
 * @param {dw.order.Order} order - SFCC Order
 * @returns {Array} Array of objects that contain information about the selected payment instruments
 */
function getSelectedPaymentInstruments(selectedPaymentInstruments, order) {
    var collections = require('*/cartridge/scripts/util/collections');
    return collections.map(selectedPaymentInstruments, function (paymentInstrument) {
        var paymentAmount = paymentInstrument.paymentTransaction.amount.value;
        if ((globaleHelpers.customAttr.order.geTransactionTotalPrice in order.custom) && order.custom[globaleHelpers.customAttr.order.geTransactionTotalPrice]) {
            paymentAmount = order.custom[globaleHelpers.customAttr.order.geTransactionTotalPrice];
        }
        var results = {
            paymentMethod: paymentInstrument.paymentMethod,
            amount: paymentAmount
        };
        if (paymentInstrument.paymentTransaction.getCustom()[globaleHelpers.customAttr.paymentTransaction.gePaymentMethodName]) {
            results.gePaymentMethod = paymentInstrument.paymentTransaction.getCustom()[globaleHelpers.customAttr.paymentTransaction.gePaymentMethodName];
        } else if (order.custom[globaleHelpers.customAttr.order.gePaymentMethodName] && selectedPaymentInstruments.size() === 1) {
            results.gePaymentMethod = order.custom[globaleHelpers.customAttr.order.gePaymentMethodName];
        }
        if (paymentInstrument.creditCardNumberLastDigits) {
            results.lastFour = paymentInstrument.creditCardNumberLastDigits;
        }
        if (paymentInstrument.creditCardHolder) {
            results.owner = paymentInstrument.creditCardHolder;
        }
        if (paymentInstrument.creditCardExpirationYear) {
            results.expirationYear = paymentInstrument.creditCardExpirationYear;
        }
        if (paymentInstrument.creditCardExpirationMonth) {
            results.expirationMonth = paymentInstrument.creditCardExpirationMonth;
        }
        if (paymentInstrument.creditCardType) {
            results.type = paymentInstrument.creditCardType;
        }
        if (paymentInstrument.maskedCreditCardNumber) {
            results.maskedCreditCardNumber = paymentInstrument.maskedCreditCardNumber;
            results.paymentMethod = 'CREDIT_CARD';
        }
        return results;
    });
}

/**
 * Payment class that represents payment information for the current basket
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @constructor
 */
function Payment(currentBasket) {
    var Order = require('dw/order/Order');
    var igGlobaleOrder = false;
    if (
        currentBasket
        && (currentBasket instanceof Order)
        && (globaleHelpers.customAttr.order.geOrderNumber in currentBasket.custom)
        && (currentBasket.custom[globaleHelpers.customAttr.order.geOrderNumber] !== null)
    ) {
        igGlobaleOrder = true;
    }
    base.apply(this, Array.prototype.slice.call(arguments));
    if (igGlobaleOrder) {
        this.selectedPaymentInstruments = getSelectedPaymentInstruments(currentBasket.paymentInstruments, currentBasket);
    }
}

Payment.prototype = Object.create(base.prototype);

module.exports = Payment;
