"use strict";

module.exports = {
    updateCheckoutViewPaymentInformationCommercePayments: function updateCheckoutViewPaymentInformationCommercePayments (e, data) {
        $('body').on('checkout:updateCheckoutView checkout:updateCheckoutViewPaymentInformation', function (e, data, customer, resdata) {
            if (!data || !data.order || !data.order.billing || !data.order.billing.payment || !data.order.billing.payment.giftCertificatePaymentInstruments || data.order.billing.payment.giftCertificatePaymentInstruments.length === 0) {
                //Commerce Payments has the ability to remove a gift certificate server side, then fail and end up back on this screen where we should show it has been removed
                $('.js-giftcertificatepaymentinstruments').html('');
                $('input#giftcertificateid').val('');
            }

            if (data && data.order && data.order.totals && data.order.totals.giftCertificatePaymentInstrumentsTotalValue && data.order.totals.grandTotalLessGiftCertificatePaymentInstrumentsValue) {
                $('body').trigger('PaymentMethodObserver:Show', { name: 'giftcertificate', show: true })
            } else {
                $('body').trigger('PaymentMethodObserver:Show', { name: 'giftcertificate', show: false })
            }

            if (data && data.order && data.order.preShippingSubmitData && 'oldBillingCountry' in data.order.preShippingSubmitData) {
                module.exports.methods.refreshPaymentMethodsOnBillingCountryChange(data, data.order.preShippingSubmitData.oldBillingCountry);
            }
        });
    },
    methods: {
        /**
         * Trigger the event to refresh the payment methods if the billing country has changed.
         * @param {order} data - order data that encapsulates the billing information
         * @param {string} billingCountry - the previous billing country
         */
        refreshPaymentMethodsOnBillingCountryChange: function refreshPaymentMethodsOnBillingCountryChange(data, billingCountry) {
            // If the billing country has changed, then trigger a refresh of the payment methods
            var billingCountryAfterSubmit;
            try {
                billingCountryAfterSubmit = data.order.billing.billingAddress.address.countryCode.value;
            } catch (e) {
                // If there is no billing country after submit, then pass null.
                billingCountryAfterSubmit = null;
            }

            if (billingCountry !== billingCountryAfterSubmit) {
                $('body')
                    .trigger('checkout:billingCountrySelected', {
                        billingDetails: {
                            address: {
                                country: billingCountryAfterSubmit
                            }
                        }
                    });
            }
        },
        selectDefaultPaymentMethodTab: function selectDefaultPaymentMethodTab(e, data) {
            if ($('.payment-options .nav-item .nav-link.active').hasClass('giftcertificate-tab')) {
                var $creditCardTab = $('.payment-options .nav-item .nav-link.salesforce-payments-tab');
                if ($creditCardTab.length) {
                    $creditCardTab.trigger('click');
                }
            }
        }
    },
    preShippingSubmitCommercePayments: function preShippingSubmitCommercePayments (e, data) {
        $('body').on('checkout:preShippingSubmit', function (e, data) {
            data.oldBillingCountry = $('.billing-address-block .billingCountry').val();
        });
    },
    preventBillingSubmitOnEnter: function preventBillingSubmitOnEnter (e, data) {
        $('#dwfrm_billing').on('submit', function (e, data) {
            if ($('.salesforce-payments-form').length) {
                e.preventDefault(); // prevent Firefox error when hitting enter in CC fields
            }
        });
    }
};
