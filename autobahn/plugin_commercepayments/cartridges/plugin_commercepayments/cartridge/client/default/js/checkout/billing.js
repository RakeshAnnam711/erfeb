'use strict';

var base = require('base/checkout/billing');
var scrollAnimate = require('base/components/scrollAnimate');

/**
 * Updates the billing address form values within payment forms
 * @param {Object} order - the order model
 */
function updateBillingAddressFormValues(order) {
    base.methods.updateBillingAddress(order);
}

/**
 * Updates the billing information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 * @param {Object} customer - customer model to use as basis of new truth
 * @param {Object} [options] - options
 */
function updateBillingInformation(order, customer) {
    base.methods.updateBillingAddressSelector(order, customer);

    // update billing address form
    updateBillingAddressFormValues(order);

    // update billing address summary and billing parts of order summary
    base.methods.updateBillingAddressSummary(order);
}

/**
 * Updates the payment information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 */
function updatePaymentInformation(order) {
    // update payment details
    var $paymentSummary = $('.payment-details');
    var htmlToAppend = '';

    if (order.billing.payment) {
        if (order.billing.payment.selectedPaymentInstruments) {
            for (var i = 0; i < order.billing.payment.selectedPaymentInstruments.length; i++) {
                var paymentInstrument = order.billing.payment.selectedPaymentInstruments[i];
                if (paymentInstrument.paymentMethod === 'GIFT_CERTIFICATE') {
                    // Render a gift card payment instrument
                    htmlToAppend += '<span> ' + order.resources.giftCardTypeLabel
                        + '</span><div>'
                        + paymentInstrument.maskedGiftCertificateCode
                        + '</div><div><span>'
                        + '</span></div>';
                }
            }
        }

        if (order.billing.payment.paymentMethod) {
            htmlToAppend += '<div class="payment-method"><span>'
                + order.billing.payment.paymentMethod.name
                + '</span></div><div class="payment-credential">'
                + order.billing.payment.paymentMethod.credential
                + '</div>';
        }
    }

    $paymentSummary.empty().append(htmlToAppend);
}

base.methods.updateBillingAddressFormValues = updateBillingAddressFormValues;
base.methods.updateBillingInformation = updateBillingInformation;
base.methods.updatePaymentInformation = updatePaymentInformation;
base.methods.clearCreditCardForm = function () {};
base.handleCreditCardNumber = function () {};
base.showPaymentErrorMessage = function () {
    $('.salesforce-payments-element-errors:not(:empty)').each(function () {
        scrollAnimate($(this));
    });
};

module.exports = base;
