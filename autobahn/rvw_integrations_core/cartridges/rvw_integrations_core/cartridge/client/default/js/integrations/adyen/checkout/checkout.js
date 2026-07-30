"use strict";
var customerHelpers = require('core/checkout/customer');

var shippingHelpers = require('core/checkout/shipping');

var billingHelpers = require('core/checkout/billing');

var summaryHelpers = require('core/checkout/summary');

var billing = require('./billing');

var adyenCheckout = require('../adyenCheckout');

var autobahnCheckout = require('core/checkout/checkout');

var methods = autobahnCheckout.methods;

methods.selectDefaultPaymentMethodTab = function selectDefaultPaymentMethodTab() {
    if ($('.payment-options .nav-item .nav-link.active').hasClass('giftcertificate-tab')) {
        var adyenTab = $('.payment-options .nav-item .nav-link.adyen-tab[href="#adyen-component-content"]');
        if (adyenTab.length) {
            $(adyenTab).click();
        }
    }
}

module.exports = {
    updateCheckoutView: function updateCheckoutView() {
        $('body').on('checkout:updateCheckoutView', function (e, data) {
            if (data.csrfToken) {
                $("input[name*='csrf_token']").val(data.csrfToken);
            }
            customerHelpers.methods.updateCustomerInformation(data.customer, data.order);
            shippingHelpers.methods.updateMultiShipInformation(data.order);
            summaryHelpers.updateTotals(data.order.totals);
            data.order.shipping.forEach(function (shipping) {
                shippingHelpers.methods.updateShippingInformation(shipping, data.order, data.customer, data.options);
            });
            var currentStage = location.search.substring( // eslint-disable-line no-restricted-globals
                location.search.indexOf('=') + 1 // eslint-disable-line no-restricted-globals
            );

            if (['shipping','payment'].indexOf(currentStage) !== -1) {
              adyenCheckout.renderGenericComponent();
            }

            billingHelpers.methods.updateBillingInformation(data.order, data.customer, data.options);
            billing.methods.updatePaymentInformation(data.order, data.options);
            summaryHelpers.updateOrderProductSummaryInformation(data.order, data.options);
        });
    },
    updateCheckoutViewPaymentInformationAdyen: function updateCheckoutViewPaymentInformationAdyen (e, data) {
        $('body').on('checkout:updateCheckoutViewPaymentInformation', function (e, data) {
            if (!data || !data.order || !data.order.billing || !data.order.billing.payment || !data.order.billing.payment.giftCertificatePaymentInstruments || data.order.billing.payment.giftCertificatePaymentInstruments.length === 0) {
                //Adyen has the ability to remove a gift certificate server side during ApplePay, then fail and end up back on this screen where we should show it has been removed
                $('.js-giftcertificatepaymentinstruments').html('');
                $('input#giftcertificateid').val('');
            }

            if (data && data.order && data.order.totals && data.order.totals.giftCertificatePaymentInstrumentsTotalValue && data.order.totals.grandTotalLessGiftCertificatePaymentInstrumentsValue) {
                $('body').trigger('PaymentMethodObserver:Show', { name: 'giftcertificate', show: true })
            } else {
                $('body').trigger('PaymentMethodObserver:Show', { name: 'giftcertificate', show: false })
            }
        });
    },
    updateSelectedPaymentOptionAdyen: function updateSelectedPaymentOptionAdyen () {
        var name = 'paymentError';
        var error = new RegExp("[?&]".concat(encodeURIComponent(name), "=([^&]*)")).exec(window.location.search);
        var paymentStage = new RegExp('[?&]stage=payment([^&]*)').exec(window.location.search);
        if (error || paymentStage) {
          if (error) {
            $('.error-message').show();
            $('.error-message-text').text(decodeURIComponent(error[1]));
          }
          adyenCheckout.renderGenericComponent();
        }

        $('#selectedPaymentOption').val($('.payment-options .nav-item .active').parent().attr('data-method-id'));
        $('.payment-options .nav-link').click(function setAttr() {
            $('#selectedPaymentOption').val($(this).parent().attr('data-method-id'));
        });
    },
    methods: methods
};
