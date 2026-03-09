'use strict';

var base = module.superModule;
var paymentDecorators = require('*/cartridge/models/payment/decorators/index');

/**
 * Payment class that represents payment information for the current basket
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {dw.customer.Customer} currentCustomer - the associated Customer object
 * @param {string} countryCode - the associated Site countryCode
 * @constructor
 */
function Payment(currentBasket, currentCustomer, countryCode) {
    base.call(this, currentBasket, currentCustomer, countryCode);

    var Resource = require('dw/web/Resource');

    paymentDecorators.currencyCode(this, currentBasket, currentCustomer, countryCode);
    paymentDecorators.paymentInstruments(this, currentBasket, currentCustomer, countryCode);
    paymentDecorators.giftCertificatePaymentInstruments(this, currentBasket, currentCustomer, countryCode);

    // Sort GIFT_CERTIFICATE last
    if (this.applicablePaymentMethods && this.applicablePaymentMethods.sort) {
        this.applicablePaymentMethods.sort((a, b) => [null].concat(this.paymentMethodSortIDs).indexOf(a.ID)); // [0] intenionally null, additional methods can be added
    }
}

// Matched sort
Payment.prototype.paymentMethodSortIDs = ['GIFT_CERTIFICATE'];

module.exports = Payment;
