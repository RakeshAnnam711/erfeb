'use strict';

var coreBilling = require('core/checkout/billing');
var scrollAnimate = require('core/components/scrollAnimate');
var cleave = require('base/components/cleave');

/**
 * Updates the payment information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 */
function updatePaymentInformation(order) {
    // update payment details
    var $paymentSummary = $('.payment-details');
    var htmlToAppend = '';

    if (order && order.billing && order.billing.payment && order.billing.payment.selectedPaymentInstruments && order.billing.payment.selectedPaymentInstruments.length > 0) {
        for (var i in order.billing.payment.selectedPaymentInstruments) {
            var paymentInstrument = order.billing.payment.selectedPaymentInstruments[i];

            if (paymentInstrument.paymentMethod === "GIFT_CERTIFICATE") {
                htmlToAppend +=
                    '<div class="mb-3">'
                    + '<div>' + order.resources.giftCertificateLabel + '</div>'
                    + '<div>' + paymentInstrument.giftCertificateCode + '</div>'
                    + '<div>' + order.resources.giftCertificateAmountLabel + ' ' + paymentInstrument.formattedAmount + '</div>'
                    + '<div>' + order.resources.giftCertificateRemainingBalanceLabel + ' ' + paymentInstrument.formattedRemainingBalance + '</div>'
                    + '</div>'
            } else {
                htmlToAppend += '<div class="mb-3">';
                if (paymentInstrument.paymentMethod === 'PayPal') {
                    if (paymentInstrument.paymentMethod) {
                        htmlToAppend += "<div>".concat(paymentInstrument.paymentMethod, "</div>");
                        htmlToAppend += "<div>".concat(paymentInstrument.formattedAmount, "</div>");
                    }
                    if (paymentInstrument.maskedCreditCardNumber) {
                        htmlToAppend += "<div>".concat(paymentInstrument.maskedCreditCardNumber, "</div>");
                    }
                } else {
                    if (paymentInstrument.name) {
                        htmlToAppend += '<div class="payment-method"><span>' + paymentInstrument.name + '</span></div>'
                    }
                    if (paymentInstrument.credential) {
                        htmlToAppend += '<div class="payment-credential">' + paymentInstrument.credential + '</div>';
                    }
                }

                htmlToAppend += '</div>';
            }
        }
    }
    if (order) {
        $paymentSummary.empty().append(htmlToAppend);
    }
}

/**
 * Validate and update payment instrument form fields
 * @param {Object} order - the order model
 */
function validateAndUpdateBillingPaymentInstrument(order) {
    var billing = order.billing;
    if (!billing.billingAddress || !billing.billingAddress.address) return;

    var form = $('form[name=dwfrm_billing]');
    if (!form) return;

    if (billing.payment && billing.payment.selectedPaymentInstruments
        && billing.payment.selectedPaymentInstruments.length > 0) {
        var instrument = billing.payment.selectedPaymentInstruments[0];
        $('select[name$=expirationMonth]', form).val(instrument.expirationMonth);
        $('select[name$=expirationYear]', form).val(instrument.expirationYear);
        // Force security code and card number clear
        //$('input[name$=securityCode]', form).val('');
        //$('input[name$=cardNumber]').data('cleave').setRawValue('');
    }
}

/**
 * updates the billing address form values within payment forms
 * @param {Object} order - the order model
 */
function updateBillingAddressFormValues(order) {
    coreBilling.methods.updateBillingAddress(order);
}

/**
 * Triggers an event when the billing country is changed.
 */
function onBillingCountryChange() {
    $('.billing-address-block .billingCountry').on('change', function () {
        $('body').trigger('checkout:billingCountrySelected', {
            billingDetails: {
                address: {
                    country: $('.billing-address-block .billingCountry').val()
                }
            }
        });
    });
}

/**
 * Triggers an event when the billing address is changed from the saved address dropdown. This is the same event
 * that is triggered when the billing country is changed. See onBillingCountryChange().
 */
function onBillingAddressChange() {
    var previousBillingCountry;

    $('.billing-address-block #billingAddressSelector').on('focus', function () {
        previousBillingCountry = $('.billing-address-block .billingCountry').val();
    }).change(function () {
        var currentBillingCountry = $('.billing-address-block .billingCountry').val();

        // Trigger the payment method refresh only when a different billing country is selected
        if (previousBillingCountry !== currentBillingCountry) {
            // Update the previous one with the current
            previousBillingCountry = currentBillingCountry;
            // Trigger the event to refresh the payment methods
            $('body').trigger('checkout:billingCountrySelected', {
                billingDetails: {
                    address: {
                        country: currentBillingCountry
                    }
                }
            });
        }
    });
}

function santitizeForm () {
    $('body').on('checkout:serializeBilling', function (e, data) {
        var serializedForm = cleave.serializeData(data.form);
        serializedForm = serializedForm || '';
        var isPayPalExpress = $('.sfpp-payment-instrument-paypal');
        if (serializedForm.includes('Salesforce%20Payments') && isPayPalExpress && isPayPalExpress.length === 1) {
            var isSFPayPal = { isSFPayPal: true};
            serializedForm = serializedForm + '&' + $.param(isSFPayPal);
        }

        data.callback(serializedForm);
    });
}



module.exports = {
    methods: {
        updatePaymentInformation: updatePaymentInformation,
        updateBillingAddressFormValues: updateBillingAddressFormValues,
        clearCreditCardForm: function () {},
        validateAndUpdateBillingPaymentInstrument: validateAndUpdateBillingPaymentInstrument
    },
    santitizeForm: santitizeForm,
    onBillingAddressChange: onBillingAddressChange,
    onBillingCountryChange: onBillingCountryChange,
    handleCreditCardNumber: function () {},
    showPaymentErrorMessage: function () {
        $('.salesforce-payments-element-errors:not(:empty)').each(function () {
            scrollAnimate($(this));
        });
    }
};
