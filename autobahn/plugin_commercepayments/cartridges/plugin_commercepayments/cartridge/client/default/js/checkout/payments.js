'use strict';

var scrollAnimate = require('base/components/scrollAnimate');

module.exports = {
    updatePaymentOptions: function () {
        if (window.sfpp) {
            sfpp.ready(function () {   // eslint-disable-line
                var element = $('.salesforce-payments-element');
                var errorElement = $('.salesforce-payments-element-errors');
                var payments = sfpp.get('payments');   // eslint-disable-line

                // Update error message on change
                payments.on('change', function (event) {
                    if (event.error) {
                        // Inform the customer that there is an error.
                        errorElement.empty().text(event.error.message);
                    } else {
                        // Clear out error message
                        errorElement.empty();
                    }
                });

                $('body').on('checkout:beforeShippingMethodSelected checkout:beforeGiftCertificateUpdate', function () {
                    element.spinner().start();
                });

                $('body').on('checkout:shippingMethodSelected checkout:giftCertificateUpdate', function (e, data) {
                    // Show/hide payment card based on payment amount
                    $('form.payment-method-form').toggle(data.paymentRequestOptions.total.amount > 0);

                    payments.refresh().finally(function () {
                        element.spinner().stop();
                    });
                });

                // Confirm payment or display an error when the event is fired.
                $('body').on('checkout:confirmPayment', function (e, data) {
                    payments.updateBillingDetails(data.billingDetails);
                    payments.confirm().then(function () {
                        // Clear out error message
                        errorElement.empty();

                        // Execute callback supplied in event
                        data.callback();
                    },
                    function (err) {
                        // Handle the error
                        data.errorCallback();

                        // Inform the customer that there was an error.
                        errorElement.empty().text(err.message);
                        scrollAnimate(errorElement);
                    });
                });
            });
        }
    }
};
