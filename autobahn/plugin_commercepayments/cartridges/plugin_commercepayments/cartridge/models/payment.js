'use strict';

var base = module.superModule;

var SalesforcePaymentMethod = require('dw/extensions/payments/SalesforcePaymentMethod');
var Resource = require('dw/web/Resource');

var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

var collections = require('*/cartridge/scripts/util/collections');

/**
 * Creates an array of objects containing selected payment information
 * @param {dw.util.ArrayList<dw.order.PaymentInstrument>} selectedPaymentInstruments - ArrayList
 *      of payment instruments that the user is using to pay for the current basket
 * @returns {Array} Array of objects that contain information about the selected payment instruments
 */
function getSelectedPaymentInstruments(selectedPaymentInstruments, paymentIntent) {
    return collections.map(selectedPaymentInstruments, function (paymentInstrument) {
        var results = {
            paymentMethod: paymentInstrument.paymentMethod,
            amount: paymentInstrument.paymentTransaction.amount.value
        };
        if (paymentInstrument.paymentMethod === 'Salesforce Payments' && paymentIntent && paymentIntent.paymentMethod) {
            if (paymentIntent.paymentMethod.type === SalesforcePaymentMethod.TYPE_CARD) {
                var brand = Resource.msgf('label.card.brand.' + paymentIntent.paymentMethod.brand, 'payment', null);
                results.name = Resource.msg('label.method.card', 'payment', null),
                results.credential = Resource.msgf('label.credential.card', 'payment', null, brand, paymentIntent.paymentMethod.last4)
            } else if (paymentIntent.paymentMethod.type === SalesforcePaymentMethod.TYPE_IDEAL) {
                results.name = Resource.msg('label.method.ideal', 'payment', null),
                results.credential = Resource.msgf('label.credential.ideal', 'payment', null, paymentIntent.paymentMethod.bank)
            } else if (paymentIntent.paymentMethod.type === SalesforcePaymentMethod.TYPE_SEPA_DEBIT) {
                results.name = Resource.msg('label.method.sepa_debit', 'payment', null),
                results.credential = Resource.msgf('label.credential.sepa_debit', 'payment', null, paymentIntent.paymentMethod.last4)
            } else if (paymentIntent.paymentMethod.type === SalesforcePaymentMethod.TYPE_BANCONTACT) {
                results.name = Resource.msg('label.method.bancontact', 'payment', null),
                results.credential = Resource.msgf('label.credential.bancontact', 'payment', null, paymentIntent.paymentMethod.bankName, paymentIntent.paymentMethod.last4)
            } else {
                results.name = Resource.msg('label.method.' + paymentIntent.paymentMethod.type, 'payment', null),
                results.credential = ''
            };

            results.lastFour = paymentIntent.paymentMethod.last4;
            results.type = paymentIntent.paymentMethod.brand;
            results.maskedCreditCardNumber = paymentIntent.paymentMethod.last4;
        } else if (paymentInstrument.paymentMethod === 'GIFT_CERTIFICATE') {
            results.giftCertificateCode = paymentInstrument.giftCertificateCode;
            results.maskedGiftCertificateCode = paymentInstrument.maskedGiftCertificateCode;
        }

        return results;
    });
}

/**
 * Payment class that represents payment information for the current basket
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {dw.customer.Customer} currentCustomer - the associated Customer object
 * @param {string} countryCode - the associated Site countryCode
 * @constructor
 */
function Payment(currentBasket, currentCustomer, countryCode) {
    base.call(this, currentBasket, currentCustomer, countryCode);

    var paymentIntent = paymentHelpers.getPaymentIntent(currentBasket);
    var paymentInstruments = currentBasket.paymentInstruments;
    this.selectedPaymentInstruments = paymentInstruments ? getSelectedPaymentInstruments(paymentInstruments, paymentIntent) : null;
}

Payment.prototype = Object.create(base.prototype);

module.exports = Payment;
