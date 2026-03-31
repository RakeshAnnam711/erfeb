'use strict';

var baseBilling = require('base/checkout/billing');
var baseHandleCreditCardNumber = baseBilling.handleCreditCardNumber;
var addressHelpers = require('./address');

baseBilling.handleCreditCardNumber = function () {
    if ($('.cardNumber').length && $('#cardType').length) {
        return baseHandleCreditCardNumber.apply(this, arguments);
    }
},

baseBilling.methods.updateBillingAddress = function updateBillingAddress(order) {
    if (order.orderEmail) {
        $('input[name$=_email]', form).val(order.orderEmail);
    }

    var billing = order.billing;
    if (!billing.billingAddress || !billing.billingAddress.address) return;

    var form = $('form[name=dwfrm_billing]');
    if (!form) return;

    $('input[name$=_firstName]', form).val(billing.billingAddress.address.firstName);
    $('input[name$=_lastName]', form).val(billing.billingAddress.address.lastName);
    $('input[name$=_address1]', form).val(billing.billingAddress.address.address1);
    $('input[name$=_address2]', form).val(billing.billingAddress.address.address2);
    $('input[name$=_city]', form).val(billing.billingAddress.address.city);
    $('input[name$=_postalCode]', form).val(billing.billingAddress.address.postalCode);
    $('select[name$=_stateCode],input[name$=_stateCode]', form)
        .val(billing.billingAddress.address.stateCode);
    $('select[name$=_country]', form).val(billing.billingAddress.address.countryCode.value);
    $('input[name$=_phone]', form).val(billing.billingAddress.address.phone);
};

baseBilling.selectSavedPaymentInstrument = (e) => $(document).on('click', '.saved-payment-instrument', function (e) {
    e.preventDefault();
    $('.saved-payment-instrument').removeClass('selected-payment');
    $(this).addClass('selected-payment');
    $('.saved-payment-instrument .card-image').removeClass('checkout-hidden');
    $('.saved-payment-instrument .security-code-input').addClass('checkout-hidden');
    $('.saved-payment-instrument.selected-payment' +
        ' .card-image').addClass('checkout-hidden');
    $('.saved-payment-instrument.selected-payment ' +
        '.security-code-input').removeClass('checkout-hidden');
});

/**
 * Updates the payment information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 */
baseBilling.methods.updatePaymentInformation = function updatePaymentInformation(order) {
    // update payment details
    var $paymentSummary = $('.payment-details');
    var htmlToAppend = '';

    if (order && order.billing && order.billing.payment && order.billing.payment.selectedPaymentInstruments && order.billing.payment.selectedPaymentInstruments.length) {
        for (var i in order.billing.payment.selectedPaymentInstruments) {
            var paymentInstrument = order.billing.payment.selectedPaymentInstruments[i];
            if (paymentInstrument.paymentMethod === "GIFT_CERTIFICATE") {
                htmlToAppend +=
                    '<div class="mb-3">'
                        + '<div>' + order.resources.giftCertificateLabel + '</div>'
                        + '<div>' + paymentInstrument.maskedGiftCertificateCode + '</div>'
                        + '<div>' + order.resources.giftCertificateAmountLabel + ' ' + paymentInstrument.formattedAmount + '</div>'
                        + '<div>' + order.resources.giftCertificateRemainingBalanceLabel + ' ' + paymentInstrument.formattedRemainingBalance + '</div>'
                    + '</div>'
            // WGACA MODIFICATION - Affirm injection
            } else if (paymentInstrument.paymentMethod === "Affirm") {
                htmlToAppend += '<span><div class="js-affirm-payment-description">Affirm</div></span>';
            // END MODIFICATION
            } else {
                //default credit cards
                htmlToAppend +=
                    '<div class="mb-3">'
                        + '<span>' + order.resources.cardType + ' ' + paymentInstrument.type + '</span>'
                        + '<div>' + paymentInstrument.maskedCreditCardNumber + '</div>'
                        + '<div><span>' + order.resources.cardEnding + ' ' + paymentInstrument.expirationMonth + '/' + paymentInstrument.maskedExpirationYear + '</span></div>'
                    + '</div>';
            }
        }
    }
    if (order) {
        $paymentSummary.empty().append(htmlToAppend);
    }
};

baseBilling.methods.clearBillingAddressFormValues = function clearBillingAddressFormValues() {
    var $form = $('form[name=dwfrm_billing]');
    if ($form) {
        var countrySelect = $('select[name$=_country]',$form);
    }

    var clearInfo = {
        billing: {
            billingAddress: {
                address: {
                    countryCode: {
                        value: countrySelect ? countrySelect.val() : ""
                    }
                }
            }
        }
    };

    if ($form) {
        var emailInput = $('input[name$=_email]', $form);
        if (emailInput) {
            clearInfo.orderEmail = emailInput.val();
        }
    }

    baseBilling.methods.updateBillingAddressFormValues(clearInfo);
};

baseBilling.clearBillingForm = function clearBillingForm() {
    $('body').on('checkout:clearBillingForm', function () {
        baseBilling.methods.clearBillingAddressFormValues();
    });
};

/**
 * updates the billing address selector within billing forms
 * @param {Object} order - the order model
 * @param {Object} customer - the customer model
 */
baseBilling.methods.updateBillingAddressSelector = function updateBillingAddressSelector(order, customer) {
    var shippings = order.shipping;

    var form = $('form[name$=billing]')[0];
    var $billingAddressSelector = $('.addressSelector', form);
    var hasSelectedAddress = false;

    if ($billingAddressSelector && $billingAddressSelector.length === 1) {
        $billingAddressSelector.empty();
        // Add New Address option
        $billingAddressSelector.append(addressHelpers.methods.optionValueForAddress(
            null,
            false,
            order,
            { type: 'billing' }));

        // Separator -
        $billingAddressSelector.append(addressHelpers.methods.optionValueForAddress(
            order.resources.shippingAddresses, false, order, {
                // className: 'multi-shipping',
                type: 'billing'
            }
        ));

        shippings.forEach(function (aShipping) {
            var isSelected = order.billing.matchingAddressId === aShipping.UUID;
            hasSelectedAddress = hasSelectedAddress || isSelected;
            // Shipping Address option
            $billingAddressSelector.append(
                addressHelpers.methods.optionValueForAddress(aShipping, isSelected, order,
                    {
                        // className: 'multi-shipping',
                        type: 'billing'
                    }
                )
            );
        });

        if (customer.addresses && customer.addresses.length > 0) {
            $billingAddressSelector.append(addressHelpers.methods.optionValueForAddress(
                order.resources.accountAddresses, false, order));
            customer.addresses.forEach(function (address) {
                var isSelected = order.billing.matchingAddressId === address.ID;
                hasSelectedAddress = hasSelectedAddress || isSelected;
                // Customer Address option
                $billingAddressSelector.append(
                    addressHelpers.methods.optionValueForAddress({
                        UUID: 'ab_' + address.ID,
                        shippingAddress: address
                    }, isSelected, order, { type: 'billing' })
                );
            });
        }
    }

    if (hasSelectedAddress
        || (!order.billing.matchingAddressId && order.billing.billingAddress.address)
        || !order.totals.grandTotalLessGiftCertificatePaymentInstrumentsValue) {
        $(form).attr('data-address-mode', 'edit');
    } else {
        // show
        $(form).attr('data-address-mode', 'new');
    }

    $billingAddressSelector.show();
};

/**
 * Updates the billing information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 * @param {Object} customer - customer model to use as basis of new truth
 * @param {Object} [options] - options
 */
baseBilling.methods.updateBillingInformation = function updateBillingInformation(order, customer) {
    baseBilling.methods.updateBillingAddressSelector(order, customer);

    // update billing address form
    baseBilling.methods.updateBillingAddressFormValues(order);

    // update billing address summary and billing parts of order summary
    baseBilling.methods.updateBillingAddressSummary(order);
};

/**
 * Validate and update payment instrument form fields
 * @param {Object} order - the order model
 */

baseBilling.methods.validateAndUpdateBillingPaymentInstrument = function validateAndUpdateBillingPaymentInstrument(order) {
    var billing = order.billing;
    if (!billing.payment || !billing.payment.selectedPaymentInstruments
        || billing.payment.selectedPaymentInstruments.length <= 0) return;

    var form = $('form[name=dwfrm_billing]');
    if (!form) return;

    var instrument = billing.payment.selectedPaymentInstruments[0];
    // Reset Fields
    $('select[name$=expirationMonth]', form).val(instrument.expirationMonth);
    $('select[name$=expirationYear]', form).val(instrument.expirationYear);
    // Force security code and card number clear
    $('input[name$=securityCode]', form).val('');
    $('input[name$=cardNumber]', form).data('cleave')?.setRawValue?.('');
}

module.exports = baseBilling;
