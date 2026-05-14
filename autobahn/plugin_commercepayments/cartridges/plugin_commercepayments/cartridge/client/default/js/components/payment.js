'use strict';

/**
 * Register payment request buttons on the page that have not yet been registered.
 */
function registerPaymentRequestButtons() {
    if (window.sfpp) {
        sfpp.ready(function () {   // eslint-disable-line
            $('.salesforce-paymentrequest-element').each(function () {
                var element = $(this);
                if (element.hasClass('salesforce-paymentrequest-element-registered')) {
                    // Only register each button once
                    return;
                }

                element.addClass('salesforce-paymentrequest-element-registered');

                var errorElement = $('.' + element.data('errorsclass'));
                var paymentrequest = sfpp.get(element.data('paymentrequestid'));   // eslint-disable-line

                // Update error message on change
                paymentrequest.on('change', function (event) {
                    if (event.error) {
                        // Inform the customer that there is an error.
                        errorElement.empty().text(event.error.message);
                    } else {
                        // Clear out error message
                        errorElement.empty();
                    }
                });

                $('body').on('cart:beforeUpdate cart:beforeShippingMethodSelected checkout:beforeShippingMethodSelected promotion:beforeUpdate checkout:beforeGiftCertificateUpdate', function () {
                    element.attr('disabled', true);
                });

                $('body').on('cart:update cart:shippingMethodSelected checkout:shippingMethodSelected promotion:success promotion:error checkout:giftCertificateUpdate', function (e, data) {
                    paymentrequest.updatePaymentRequest(data.paymentRequestOptions);
                    var enabled = data.paymentRequestOptions.total.amount > 0;
                    element.attr('disabled', !enabled);
                });

                paymentrequest.on('payment', function () {
                    $.ajax({
                        url: element.data('placeorder'),
                        method: 'POST',
                        contentType: 'application/json; charset=UTF-8',
                        success: function (data) {
                            if (data.error) {
                                // Inform the customer that there is an error.
                                errorElement.empty().text(data.errorMessage);
                            } else {
                                // Show the order confirmation page

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
                            }
                        },
                        error: function (err) {
                            // Inform the customer that there is an error.
                            errorElement.empty().text(err.message);
                        }
                    });
                });
            });
        });
    }
}

module.exports = function () {
    $('body').on('paymentrequestbutton:register', function () {
        registerPaymentRequestButtons();
    });
};
