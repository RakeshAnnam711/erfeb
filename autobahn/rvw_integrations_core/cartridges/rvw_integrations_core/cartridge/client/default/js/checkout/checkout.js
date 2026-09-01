'use strict';

var siteIntegrations = require('../integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();

var customerHelpers = require('core/checkout/customer');
var coreSummaryHelpers = require('core/checkout/summary');

var integrationsBilling = require('./billing');
var integrationsShipping = require('./shipping');
var integrationsCheckoutPlugin = require('./checkoutPlugin');

var autobahnCheckout = require('core/checkout/checkout');
var autobahnExtensions = [integrationsBilling, integrationsShipping, integrationsCheckoutPlugin];

if (toggleObject.sfcommercepaymentsCartridgeEnabled) {
    autobahnExtensions.push(require('../integrations/commercepayments/checkout/checkout'));
    autobahnExtensions.push(require('../integrations/commercepayments/checkout/payments'));
}

// we want to bring in all the stuff from cybersource billing and shipping and add it to autobahnCheckout
autobahnExtensions.forEach(function (library) {
    Object.keys(library).forEach(function (key) {
        if (typeof library[key] === 'object') {
            autobahnCheckout[key] = $.extend({}, autobahnCheckout[key], library[key]);
        } else {
            autobahnCheckout[key] = library[key];
        }
    });
});

// THEN merge in any of the 3rd party checkout functions.
if (toggleObject.bopisCartridgeEnabled) {
    autobahnCheckout.updateCheckoutView = function () {
        $('body').on('checkout:updateCheckoutView', function (e, data) {
            if (data.csrfToken) {
                $("input[name*='csrf_token']").val(data.csrfToken);
            }
            customerHelpers.methods.updateCustomerInformation(data.customer, data.order);
            autobahnCheckout.methods.updateMultiShipInformation(data.order);
            coreSummaryHelpers.updateTotals(data.order.totals);

            data.order.shipping.forEach(function (shipping) {
                autobahnCheckout.methods.updateShippingInformation(
                    shipping,
                    data.order,
                    data.customer,
                    data.options
                );
            });

            autobahnCheckout.methods.updateBillingInformation(
                data.order,
                data.customer,
                data.options
            );

            autobahnCheckout.methods.updatePaymentInformation(data.order, data.options);
            coreSummaryHelpers.updateOrderProductSummaryInformation(data.order, data.options);
        });
    };
}

autobahnCheckout.updateCheckoutViewPaymentInformation = function() {
    $('body').on('checkout:updateCheckoutViewPaymentInformation', function (e, data) {
        coreSummaryHelpers.updateTotals(data.order.totals);
        coreSummaryHelpers.updateOrderProductSummaryInformation(data.order, data.options);
        autobahnCheckout.methods.updatePaymentInformation(data.order, data.options);
    })
}

autobahnCheckout.updateMultiShipMessaging = function() {
    // Update multiship messaging for applepay and others
    $(document).on('checkout:updateCheckoutView', function (e, data) {
        $('body').trigger('PaymentMethodObserver:Show', { name: 'multiship', show: data && data.order && data.order.usingMultiShipping && !data.order.hasPickupInstoreItem });
    })
}

module.exports = autobahnCheckout;
