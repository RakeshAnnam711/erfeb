'use strict';

var recaptcha = require('core/components/recaptcha');

/**
 * Returns the expected number of express checkout buttons that may be rendered for the given component.
 * @param {Object} component - the SFPP component
 * @returns {integer} expected number of buttons
 */
function getExpectedExpressCheckoutButtonsCount(component) {
    var renderedTypes = component.getRenderedTypes();
    var count = 0;
    if (renderedTypes.indexOf('applepay') !== -1 || renderedTypes.indexOf('paymentrequest') !== -1) {
        count++;
    }
    if (renderedTypes.indexOf('paypalexpress') !== -1) {
        count++;
    }
    return count;
}

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
                var messages = sfpp.get(element.data('paymentrequestid') + '-messages');   // eslint-disable-line

                var expectedExpressCheckoutButtons = getExpectedExpressCheckoutButtonsCount(paymentrequest);
                var renderedExpressCheckoutButtons;
                var stripePayment;

                /**
                 * Shows express checkout button skeletons.
                 */
                function showExpressCheckoutButtonSkeletons() {
                    element.addClass('salesforce-paymentrequest-element-loading');
                    element.prepend('<div class="salesforce-paymentrequest-element-skeletons"></div>');
                    for (var i = 0; i < expectedExpressCheckoutButtons; i++) {
                        element.children('.salesforce-paymentrequest-element-skeletons').append('<div class="salesforce-paymentrequest-element-skeleton"><button type="button" class="btn" disabled></button></div>');
                    }
                    renderedExpressCheckoutButtons = 0;
                }

                /**
                 * Removes express checkout button skeletons.
                 */
                function removeExpressCheckoutButtonSkeletons() {
                    element.children('.salesforce-paymentrequest-element-skeletons').remove();
                    element.removeClass('salesforce-paymentrequest-element-loading');
                }

                // Don't Show express checkout buttons skeletons while initially loading
                // showExpressCheckoutButtonSkeletons();

                paymentrequest.on('render', function () {
                    // Show express checkout buttons skeletons after refreshing
                    expectedExpressCheckoutButtons = getExpectedExpressCheckoutButtonsCount(paymentrequest);
                    showExpressCheckoutButtonSkeletons();
                });

                /**
                 * Called each time an express checkout button is shown.
                 */
                function expressCheckoutButtonShown() {
                    renderedExpressCheckoutButtons++;
                    if (renderedExpressCheckoutButtons >= expectedExpressCheckoutButtons) {
                        removeExpressCheckoutButtonSkeletons();
                    }
                }

                paymentrequest.on('paypal.init', expressCheckoutButtonShown);
                paymentrequest.on('paymentrequest.init', expressCheckoutButtonShown);

                // Update error message on change
                paymentrequest.on('change', function (event) {
                    if (event.error) {
                        // Inform the customer that there is an error.
                        errorElement.empty().text(event.error.message);

                        if (stripePayment) {
                            // Fail the shopper order
                            recaptcha.check(event, {
                                url: element.data('fail-order-url'),
                                method: 'POST',
                                data: {
                                    orderID: stripePayment.orderNo,
                                    orderToken: stripePayment.orderToken
                                },
                                success: function () {},
                                error: function () {}
                            });

                            stripePayment = null;
                        }
                    } else {
                        // Clear out error message
                        errorElement.empty();
                    }
                });

                $('body').on('cart:beforeUpdate cart:beforeShippingMethodSelected checkout:beforeShippingMethodSelected promotion:beforeUpdate checkout:beforeGiftCertificateUpdate', function () {
                    element.attr('disabled', true);
                });

                $('body').on('cart:update cart:shippingMethodSelected checkout:shippingMethodSelected promotion:success promotion:error checkout:giftCertificateUpdate', function (e, data) {
                    if ('paymentRequestOptions' in data && data.paymentRequestOptions) {
                        paymentrequest.updatePaymentRequest(data.paymentRequestOptions);
                        var enabled = data.paymentRequestOptions.total.amount > 0;
                        element.attr('disabled', !enabled);

                        if (messages) {
                            messages.updateAmount(data.paymentRequestAmount);
                        }
                    }
                });

                $('body').on('checkout:billingCountrySelected', function (e, data) {
                    // Update payment billing details and refresh when country changed
                    paymentrequest.updateBillingDetails(data.billingDetails);
                    paymentrequest.refresh();
                });

                if (element.data('shippingaddresschange')) {
                    paymentrequest.on('shippingaddresschange', function (evt) {
                        recaptcha.check(evt, {
                            url: element.data('shippingaddresschange'),
                            method: 'POST',
                            contentType: 'application/json; charset=UTF-8',
                            data: JSON.stringify({shippingAddress: evt.shippingAddress}),
                            success: function (response) {
                                evt.updateWith(response);
                            },
                            error: function () {
                                evt.updateWith({
                                    status: 'fail'
                                });
                            }
                        });
                    });
                }

                if (element.data('shippingoptionchange')) {
                    paymentrequest.on('shippingoptionchange', function (evt) {
                        recaptcha.check(evt, {
                            url: element.data('shippingoptionchange'),
                            method: 'POST',
                            contentType: 'application/json; charset=UTF-8',
                            data: JSON.stringify({shippingOption: evt.shippingOption}),
                            success: function (response) {
                                evt.updateWith(response);
                            },
                            error: function () {
                                evt.updateWith({
                                    status: 'fail'
                                });
                            }
                        });
                    });
                }

                if (element.data('paymentmethod')) {
                    paymentrequest.on('paymentmethod', function (evt) {
                        recaptcha.check(evt, {
                            url: element.data('paymentmethod'),
                            method: 'POST',
                            contentType: 'application/json; charset=UTF-8',
                            data: JSON.stringify({event: evt}),
                            success: function (response) {
                                if (response.errorMessage) {
                                    // Inform the customer that there is an error.
                                    errorElement.empty().text(response.errorMessage);
                                }
                                evt.updateWith(response);
                            },
                            error: function () {
                                evt.updateWith({
                                    status: 'fail'
                                });
                            }
                        });
                    });
                }

                /**
                 * Prepares a Stripe PaymentIntent for confirmation, and creates an order.
                 * @param {Object} evt - event object with callback function
                 */
                function prepareStripePayment(evt) {
                    recaptcha.check(evt, {
                        url: element.data('preparestripepayment'),
                        method: 'POST',
                        contentType: 'application/json; charset=UTF-8',
                        data: JSON.stringify(evt),
                        success: function (response) {
                            // Keep track of created payment and order information
                            stripePayment = response;

                            // Execute event callback
                            evt.updateWith(response);
                        },
                        error: function () {
                            stripePayment = null;
                            evt.updateWith({
                                status: 'fail'
                            });
                        }
                    });
                }

                paymentrequest.on('preparepaymentintent', prepareStripePayment);

                paymentrequest.on('prepareorder', function (evt) {
                    if (stripePayment) {
                        // Execute event callback
                        setTimeout(function () {
                            evt.updateWith(stripePayment);
                        });
                    } else {
                        // Prepare a Stripe payment and order
                        prepareStripePayment(evt);
                    }
                });

                paymentrequest.on('payment', function (e) {
                    recaptcha.check(e, {
                        url: element.data('submit-order-url'),
                        method: 'POST',
                        data: {
                            orderID: stripePayment.orderNo,
                            orderToken: stripePayment.orderToken
                        },
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

                            // Fail the shopper order
                            recaptcha.check(null, {
                                url: element.data('fail-order-url'),
                                method: 'POST',
                                data: {
                                    orderID: stripePayment.orderNo,
                                    orderToken: stripePayment.orderToken
                                },
                                success: function () {},
                                error: function () {}
                            });

                            stripePayment = null;
                        }
                    });
                });

                paymentrequest.on('paypal.approve', function (e) {
                    recaptcha.check(e, {
                        url: element.data('paypalapprove'),
                        type: 'post',
                        data: '',
                        success: function (data) {
                            window.location.href = data.redirectUrl;
                        },
                        error: function (err) {
                            if (err.responseJSON && err.responseJSON.redirectUrl) {
                                window.location.href = err.responseJSON.redirectUrl;
                            } else {
                                // Inform the customer that there is an error.
                                errorElement.empty().text(err.responseJSON.message);
                            }
                        }
                    });
                });

                paymentrequest.on('cancel', function () {
                    window.location.reload();
                });
            });
        });
    }
}

function onPaymentRequestButtonRegister() {
    $('body').on('paymentrequestbutton:register', function () {
        module.exports.methods.registerPaymentRequestButtons();
    });
}

function onTrackBuyNowiframe () {
    $('body').on('PaymentMethodObserver:AddNode', function (e, data) {
        if (data && data.addNode && data.addNode.classList){
            for (var className of data.addNode.classList) {
                if (className === 'StripeElement') {
                    var container = $(data.target).find('.js-paymentmethodwarning-msgcontainer');
                    if (container.length) {
                        container.attr('data-iframepresent', true);
                        container.data('iframepresent', true);
                        $('body').trigger('PaymentMethodObserver:iframePresent');
                        data.observer.disconnect();
                    }
                    return;
                }
            }
        }
    })
}

function onTrackCreditCardiframe () {
    $('body').on('PaymentMethodObserver:AddNode', function (e, data) {
        if (data && data.addNode && data.addNode.classList){
            for (var className of data.addNode.classList) {
                if (className === 'sfpp-payment-method-card') {
                    var container = $(data.target).find('.js-paymentmethodwarning-msgcontainer');
                    if (container.length) {
                        container.attr('data-iframepresent', true);
                        container.data('iframepresent', true);
                        $('body').trigger('PaymentMethodObserver:iframePresent');
                        data.observer.disconnect();
                    }
                    return;
                }
            }
        }
    });
}

module.exports = {
    methods: {
        registerPaymentRequestButtons: registerPaymentRequestButtons,
    },
    onTrackBuyNowiframe: onTrackBuyNowiframe,
    onTrackCreditCardiframe: onTrackCreditCardiframe,
    onPaymentRequestButtonRegister: onPaymentRequestButtonRegister
};
