'use strict';

var coreMembers = require('core/checkout/plugin/members');
var baseInitialize = coreMembers.initialize;
var baseHandleSubmitPaymentSuccess = coreMembers.handleSubmitPaymentSuccess;

function handleSubmitPaymentSuccess(e, data, defer) {
    var scope = this;

    if (data.orderID && data.orderToken && data.continueUrl) {
        //non cc orders are placed during submitpayment, so just skip to order-confirm
        var redirect = $('<form>')
            .appendTo(document.body)
            .attr({
                method: 'POST',
                action: data.continueUrl
            });

        $('<input>')
            .appendTo(redirect)
            .attr({
                name: 'orderID',
                value: data.orderID
            });

        $('<input>')
            .appendTo(redirect)
            .attr({
                name: 'orderToken',
                value: data.orderToken
            });

        redirect.submit();

        defer.resolve(data);
    } else if (data?.order?.totals?.grandTotalLessGiftCertificatePaymentInstrumentsValue > 0) {
        $('body').trigger('checkout:confirmPayment', {
            billingDetails: data.billingDetails,
            callback: function (stripePayment) {
                var paymentForm = '';
                if (stripePayment && stripePayment.orderNo) {
                    paymentForm = {
                        orderID: stripePayment.orderNo,
                        orderToken: stripePayment.orderToken
                    };
                }

                return coreMembers.handlePlaceOrderStage(e, defer, paymentForm);
            },
            errorCallback: function () {
                $('body').trigger('checkout:updateCheckoutView', {
                    order: data.order,
                    customer: data.customer
                });

                // enable the next:Place Order and Pay Now buttons here
                $('body').trigger('checkout:enableButton', '.next-step-button button');
            }
        });
    } else if (data?.order?.totals?.grandTotalLessGiftCertificatePaymentInstrumentsValue === 0) {
        // GiftCert covers total basket
        return coreMembers.handlePlaceOrderStage(e, defer);
    } else {
        // Fallback to native (if data object is incomplete for sfpay)
        return baseHandleSubmitPaymentSuccess.apply(scope, arguments);
    }
}

module.exports = {
    initialize: function (target) {
        $('body').on('checkout:paypalOrderApproved', function (e) {
            var defer = $.Deferred(); // eslint-disable-line
            return coreMembers.handlePaymentStage(e, defer, {isSFPayPal: true, isSFPayPalImmediate: true});
        });

        baseInitialize.apply(this, arguments);
    },

    validateAndSerializeCreditCard: function () {
        //commerce payments validates credit card using stripe call, nothing to send to server
        return '';
    },

    handleSubmitPaymentSuccess: handleSubmitPaymentSuccess
}
