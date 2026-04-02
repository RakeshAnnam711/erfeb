'use strict';

// exported functions
var addressHelpers = require('./address');
var customerHelpers = require('./customer');
var shippingHelpers = require('./shipping');
var billingHelpers = require('./billing');
var checkoutPlugin = require('./checkoutPlugin');

// helper functions
var formHelpers = require('./formErrors');
var summaryHelpers = require('./summary');

// base sfra checkout/checkout
// Avoid referencing base checkout. base checkout triggers base helper initialization EX: Billing.js and Cleave.js
var base = {
    initialize: () => { /* checkoutPlugin.js */ },
    updateCheckoutView: () => { /* checkoutPlugin.js */ },
    disableButton: function () {
        $('body').on('checkout:disableButton', (e, button) => $(button).prop('disabled', true));
    },

    enableButton: function () {
        $('body').on('checkout:enableButton', (e, button) => $(button).prop('disabled', false));
    }
};

[customerHelpers, billingHelpers, shippingHelpers, addressHelpers, checkoutPlugin].forEach(function (library) {
    Object.keys(library).forEach(function (item) {
        if (typeof library[item] === 'object') {
            base[item] = $.extend({}, base[item], library[item]);
        } else {
            base[item] = library[item];
        }
    });
});

base.methods = base.methods || {};

//Autobahn simply chooses to re-select the credit card tab only if the current active tab is the Gift Certificate one
//Clients may wish to extend this with more complex logic to conditionally select ApplePay or some other payment method that is only sometimes
//available for a given browser
base.methods.selectDefaultPaymentMethodTab = function selectDefaultPaymentMethodTab(e, data) {
    if ($('.payment-options .nav-item .nav-link.active').hasClass('giftcertificate-tab')) {
        var $creditCardTab = $('.payment-options .nav-item .nav-link.credit-card-tab');
        if ($creditCardTab.length) {
            $creditCardTab.trigger('click');
        }
    }
}

base.hidePaymentWithZeroDue = function hidePaymentWithZeroDue() {
    $('body').on('checkout:updateCheckoutView checkout:updateCheckoutViewPaymentInformation', function (e, data) {
        if (data && data.order && data.order.totals && data.order.totals.grandTotalLessGiftCertificatePaymentInstrumentsValue) {
            $('.payment-information').removeClass('d-none');
            $('.credit-card-selection-new').removeClass('d-none');
            $('.address-selector-block').removeClass('d-none');
            $('.billingAddressFields').removeClass('d-none');

            // fix summary screen
            $('.card.payment-summary .address-summary .addressInformation').removeClass('d-none');

            //re-select the first available tab to reset payment tabs visible area
            base.methods.selectDefaultPaymentMethodTab(e, data);
        } else {
            $('.payment-information').addClass('d-none');
            $('.credit-card-selection-new').addClass('d-none');
            $('.address-selector-block').addClass('d-none');
            $('.billingAddressFields').addClass('d-none');

            // fix summary screen
            $('.card.payment-summary .address-summary .addressInformation').addClass('d-none');

            //GC covers total in full, change the payment type of submit payment
            $('.payment-information').data('payment-method-id', 'GIFT_CERTIFICATE');
            $('.payment-information').attr('data-payment-method-id', 'GIFT_CERTIFICATE');
            $('.payment-options .nav-item .giftcertificate-tab').click();
            formHelpers.clearPreviousErrors('.payment-form');
        }

        if (data && data.order && data.order.totals && data.order.totals.grandTotalValueOrNull) {
            $('.card.payment-summary .paymentSummaryInfo').removeClass('d-none');
            $('.giftcertificate-information').removeClass('d-none');
        } else {
            $('.card.payment-summary .paymentSummaryInfo').addClass('d-none');
            $('.giftcertificate-information').addClass('d-none');
        }
    });
}

base.updateCheckoutViewPaymentInformation = function() {
    $('body').on('checkout:updateCheckoutViewPaymentInformation', function (e, data) {
        summaryHelpers.updateTotals(data.order.totals);
        summaryHelpers.updateOrderProductSummaryInformation(data.order, data.options);
        billingHelpers.methods.updatePaymentInformation(data.order, data.options);
    })
}

base.updateCheckoutView = function() {
    $('body').on('checkout:updateCheckoutView', function (e, data) {
        if (data.csrfToken) {
            $("input[name*='csrf_token']").val(data.csrfToken);
        }
        customerHelpers.methods.updateCustomerInformation(data.customer, data.order);
        shippingHelpers.methods.updateMultiShipInformation(data.order);
        summaryHelpers.updateTotals(data.order.totals);
        data.order.shipping.forEach(function (shipping) {
            shippingHelpers.methods.updateShippingInformation(
                shipping,
                data.order,
                data.customer,
                data.options
            );
        });
        billingHelpers.methods.updateBillingInformation(
            data.order,
            data.customer,
            data.options
        );
        billingHelpers.methods.updatePaymentInformation(data.order, data.options);
        summaryHelpers.updateOrderProductSummaryInformation(data.order, data.options);
    });
}


module.exports = base;
