'use strict';

var customerHelpers = require('core/checkout/customer');
var shippingHelpers = require('../shipping');
var formHelpers = require('../formErrors');
var scrollAnimate = require('core/components/scrollAnimate');
var recaptcha = require('../../components/recaptcha');
var hideShipping = $('#checkout-main').data('hide-shipping');
var scrollToFieldError = require('core/components/scrollToFieldError');
var toastHelpers = require('core/components/toast');

//
// Collect form data from user input
//
var formData = {
    // Customer Data
    customer: {},

    // Shipping Address
    shipping: {},

    // Billing Address
    billing: {},

    // Payment
    payment: {},

    // Gift Codes
    giftCode: {}
};

//
// Local member methods of the Checkout plugin
//
module.exports = {
    context: null,

    checkoutStages: [
        'customer',
        ...(hideShipping ? [] : ['shipping']),
        'payment',
        'placeOrder',
        'submitted'
    ],
    /**
    * Updates the URL to determine stage
    * @param {number} currentStage - The current stage the user is currently on in the checkout
    */
   updateUrl: function updateUrl(currentStage, replaceState) {
        history[replaceState ? 'replaceState': 'pushState'](
            this.checkoutStages[currentStage],
            document.title,
            location.pathname +
            '?stage=' +
            this.checkoutStages[currentStage] +
            '#' +
            this.checkoutStages[currentStage]
        );
    },

    // initialize the currentStage variable for the first time
    currentStage: 0,

    /**
    * Set or update the checkout stage (AKA the shipping, billing, payment, etc... steps)
    * @returns {Object} a promise
    */
    updateStage: function updateStage(e, defer, parent) {
        var stage = this.checkoutStages[this.currentStage];

        if (stage === 'customer') {
            return module.exports.handleCustomerStage(e, defer)
        } else if (stage === 'shipping') {
            return module.exports.handleShippingStage(e, defer);
        } else if (stage === 'payment') {
            return module.exports.handlePaymentStage(e, defer);
        } else if (stage === 'placeOrder') {
            return module.exports.handlePlaceOrderStage(e, defer);
        }
        var p = $('<div>').promise(); // eslint-disable-line
        setTimeout(function () {
            p.done(); // eslint-disable-line
        }, 500);
        return p; // eslint-disable-line
    },

    /**
    * Initialize the checkout stage.
    *
    * TODO: update this to allow stage to be set from server?
    */
    initialize: function initialize(target) {
        var parent = this;
        if (!target) throw new Error('JQuery FN Object required.');

        // Setup target bject for jquery.fn.checkout object
        parent.context = target;

        // set the initial state of checkout
        parent.currentStage = parent.checkoutStages
            .indexOf($('.data-checkout-stage').data('checkout-stage'));
        $(parent.context).attr('data-checkout-stage', parent.checkoutStages[parent.currentStage]);

        $(parent.context).on('click', '.submit-customer-login', function (e) {
            e.preventDefault();
            parent.nextStage(e);
        });

        $(parent.context).on('click', '.submit-customer', function (e) {
            e.preventDefault();
            parent.nextStage(e);
        });

        //
        // Handle Payment option selection
        //
        $('input[name$="paymentMethod"]', parent.context).on('change', function () {
            $('.credit-card-form').toggle($(this).val() === 'CREDIT_CARD');
        });

        //
        // Handle Next State button click
        //
        $(parent.context).on('click', '.next-step-button button', function (e) {
            parent.nextStage(e, parent);
        });

        //
        // Handle Edit buttons on shipping and payment summary cards
        //
        // $('.customer-summary .edit-button', parent.context).on('click', function () {
        //     parent.gotoStage('customer');
        // });

        $('.shipping-summary .edit-button', parent.context).on('click', function () {
            if (!$('#checkout-main').hasClass('multi-ship')) {
                $('body').trigger('shipping:selectSingleShipping');
            }

            parent.gotoStage('shipping');
        });

        $('.payment-summary .edit-button', parent.context).on('click', function () {
            parent.gotoStage('payment');
        });

        //
        // remember stage (e.g. shipping)
        //
        parent.updateUrl(parent.currentStage, true);

        //
        // Listen for foward/back button press and move to correct checkout-stage
        //
        $(window).on('popstate', function (e) {
            //
            // Back button when event state less than current state in ordered
            // checkoutStages array.
            //
            if (e.state === null ||
                parent.checkoutStages.indexOf(e.state) < parent.currentStage) {
                parent.handlePrevStage(false);
            } else if (parent.checkoutStages.indexOf(e.state) > parent.currentStage) {
                // Forward button  pressed
                parent.handleNextStage(false);
            }
        });

        //
        // Set the form data
        //
        parent.context.data('formData', formData);
    },

    /**
    * The next checkout state step updates the css for showing correct buttons etc...
    */
    nextStage: function nextStage(e) {
        var parent = this;
        var defer = $.Deferred(); // eslint-disable-line

        defer.done(function () {
            // Update UI with new stage
            $('.error-message').hide();
            parent.handleNextStage(true);
        });

        defer.fail(function (data) {
            // show errors
            if (data) {
                if (data.errorStage) {
                    parent.gotoStage(data.errorStage.stage);

                    if (data.errorStage.step === 'billingAddress') {
                        var $billingAddressSameAsShipping = $(
                            'input[name$="_shippingAddressUseAsBillingAddress"]'
                        );
                        if ($billingAddressSameAsShipping.is(':checked')) {
                            $billingAddressSameAsShipping.prop('checked', false);
                        }
                    }
                }

                if (data.errorMessage) {
                    $('.error-message').show();
                    $('.error-message-text').text(data.errorMessage);
                }
            }
        });

        parent.updateStage(e, defer, parent);
    },

    /**
    * The next checkout state step updates the css for showing correct buttons etc...
    *
    * @param {boolean} bPushState - boolean when true pushes state using the history api.
    */
    handleNextStage: function handleNextStage(bPushState) {
        var parent = this;
        if (parent.currentStage < parent.checkoutStages.length - 1) {
            // move stage forward
            parent.currentStage++;

            //
            // show new stage in url (e.g.payment)
            //
            if (bPushState) {
                parent.updateUrl(parent.currentStage);
            }
        }

        // Set the next stage on the DOM
        $(parent.context).attr('data-checkout-stage', parent.checkoutStages[parent.currentStage]);
    },

    /**
    * Previous State
    */
    handlePrevStage: function handlePrevStage() {
        var parent = this;
        if (parent.currentStage > 0) {
            // move state back
            parent.currentStage--;
            parent.updateUrl(parent.currentStage);
        }

        $(parent.context).attr('data-checkout-stage', parent.checkoutStages[parent.currentStage]);
    },

    /**
    * Use window history to go to a checkout stage
    * @param {string} stageName - the checkout state to goto
    */
    gotoStage: function gotoStage(stageName) {
        var parent = this;
        parent.currentStage = parent.checkoutStages.indexOf(stageName);
        parent.updateUrl(parent.currentStage);
        $(parent.context).attr('data-checkout-stage', parent.checkoutStages[parent.currentStage]);
    },

    validateAndSerializeCreditCard: function validateAndSerializeCreditCard(defer) {
        var ccForm = '';
        if ($('.data-checkout-stage').data('customer-type') === 'registered') {
            // if payment method is credit card
            var paymentInformation = $('.payment-information');
            if (paymentInformation.data('payment-method-id') === 'CREDIT_CARD') {
                if (!paymentInformation.data('is-new-payment') && paymentInformation.is(':visible')) {
                    var cvvCode = $('.saved-payment-instrument.' +
                        'selected-payment .saved-payment-security-code').val();
                    var cvvElement = $('.saved-payment-instrument.' + 'selected-payment ' + '.form-control');

                    var cvvPattern = cvvElement.attr('pattern');
                    if (!(cvvPattern !== '' && RegExp(cvvPattern).test(parseInt(cvvCode)))) {
                        cvvElement.addClass('is-invalid');
                        scrollAnimate(cvvElement);
                        defer.reject();
                        return defer;
                    }

                    var $savedPaymentInstrument = $('.saved-payment-instrument' +
                        '.selected-payment'
                    );

                    ccForm += '&storedPaymentUUID=' +
                        $savedPaymentInstrument.data('uuid');

                    ccForm += '&securityCode=' + cvvCode;

                    return ccForm;
                }
            }
        }
    },

    handleCustomerStage: function handleCustomerStage(e, defer) {
        //
        // Clear Previous Errors
        //
        customerHelpers.methods.clearErrors();
        //
        // Submit the Customer Form
        //
        var customerFormSelector = customerHelpers.methods.isGuestFormActive() ? customerHelpers.vars.GUEST_FORM : customerHelpers.vars.REGISTERED_FORM;
        var customerForm = $(customerFormSelector);
        var timeout = customerForm.data('timeout') || 6000; //default timeout (increased on retry)

        // retry only allow if recaptcha failed as CSRF token will be invalidated
        recaptcha.check(e, {
            url: customerForm.attr('action'),
            type: 'post',
            data: customerForm.serialize(),
            timeout: timeout,
            beforeSend: ($xhr) => {
                // Cancel Ajax
                if (customerForm.hasClass('csrf-used')) return false;

                // Interaction and resubmit prevented as CSRF Token will be expired on second submit
                customerForm.addClass('csrf-used');
                customerForm.data('timeout', timeout * 1.5);
                // customerForm.spinner().start();
                $.spinner().start();
                
                // if XHR not empty return false (skip), otherwise save current xhr
                return !customerForm.data('$xhr') && !!customerForm.data('$xhr', $xhr);
            },
            success: function (data) {
                if (data.redirectUrl) {
                    window.location.href = data.redirectUrl;
                } else {
                    // customerForm.spinner().stop();
                    $.spinner().stop();
                    customerForm.removeClass('csrf-used');
                    if (customerHelpers.methods.isGuestFormActive()) {
                        // do not clear the shipping step, keep all info already entered for checkout:updateCheckoutView event
                        if (data.order) {
                            data.order.shipping = {};
                        }
                    }
                    customerHelpers.methods.customerFormResponse(defer, data);

                    if (!data.error && hideShipping) {
                        $('body').trigger('checkout:updateCheckoutView', {
                            order: data.order,
                            customer: data.customer,
                            csrfToken: data.csrfToken
                        });

                        scrollAnimate($('.payment-section'));
                    }
                }
            },
            error: function (err) {
                // customerForm.spinner().stop();
                $.spinner().stop();
                customerForm.removeClass('csrf-used');
                if (err.responseJSON && err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
                // Server error submitting form
                defer.reject(err.responseJSON);
            },
            complete: function () {
                customerForm.data('$xhr', null); // clear saved XHR

                if (hideShipping) {
                    $('body').trigger('checkout:enableButton', '.next-step-button button');
                }
            }

        });

        return defer;
    },

    handleShippingStage: function handleShippingStage(e, defer) {
        var preShippingSubmitData = {};
        $('body').trigger('checkout:preShippingSubmit', { preShippingSubmitData: preShippingSubmitData });

        //
        // Clear Previous Errors
        //
        formHelpers.clearPreviousErrors('.shipping-form');

        //
        // Submit the Shipping Address Form
        //
        var isMultiShip = $('#checkout-main').hasClass('multi-ship');
        var formSelector = isMultiShip ?
            '.multi-shipping .active form' : '.single-shipping .shipping-form';
        var form = $(formSelector);

        if (isMultiShip && form.length === 0) {
            // disable the next:Payment button here
            $('body').trigger('checkout:disableButton', '.next-step-button button');
            // in case the multi ship form is already submitted
            var url = $('#checkout-main').attr('data-checkout-get-url');
            form.spinner().start();

            $.ajax({
                url: url,
                method: 'GET',
                success: function (data) {
                    // enable the next:Payment button here
                    $('body').trigger('checkout:enableButton', '.next-step-button button');
                    form.spinner().stop();
                    if (!data.error) {
                        data.order.preShippingSubmitData = preShippingSubmitData;
                        $('body').trigger('checkout:updateCheckoutView', {
                            order: data.order,
                            customer: data.customer
                        });
                        defer.resolve();
                    } else if (data.message && $('.shipping-error .alert-danger').length < 1) {
                        var errorMsg = data.message;
                        var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
                            'fade show" role="alert">' +
                            '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                            '<span aria-hidden="true">&times;</span>' +
                            '</button>' + errorMsg + '</div>';
                        $('.shipping-error').append(errorHtml);
                        scrollAnimate($('.shipping-section'));
                        defer.reject();
                    } else if (data.redirectUrl) {
                        window.location.href = data.redirectUrl;
                    } else if (data.shipmentUUID && data.fieldErrors && data.fieldErrors.length) {
                        data.fieldErrors.forEach(function (error) {
                            if (Object.keys(error).length) {
                                formHelpers.loadFormErrors('.multi-shipping [data-shipment-uuid="' + data.shipmentUUID + '"]', error);
                            }
                        });

                        var shippingBlockWithError = $('.multi-shipping [data-shipment-uuid="' + data.shipmentUUID + '"]');
                        if (shippingBlockWithError.find('.shipping-address-block').is(':hidden')) {
                            shippingBlockWithError.find('.btn-edit-multi-ship').click();
                            shippingBlockWithError.find('.btn-show-details').click();
                        }

                        defer.reject();
                    }
                },
                error: function () {
                    form.spinner().stop();
                    // enable the next:Payment button here
                    $('body').trigger('checkout:enableButton', '.next-step-button button');
                    // Server error submitting form
                    defer.reject();
                }
            });
        } else {
            var shippingFormData = form.serialize();

            $('body').trigger('checkout:serializeShipping', {
                form: form,
                data: shippingFormData,
                callback: function (data) {
                    shippingFormData = data;
                }
            });
            // disable the next:Payment button here
            $('body').trigger('checkout:disableButton', '.next-step-button button');
            // form.spinner().start();
            $.spinner().start();
            $.ajax({
                url: form.attr('action'),
                type: 'post',
                data: shippingFormData,
                success: function (data) {
                    // form.spinner().stop();
                    $.spinner().stop();
                    if (data.fieldErrors && data.fieldErrors.length) {
                        $('.btn-show-details').trigger('click');
                        scrollToFieldError(data);
                    }
                    data.preShippingSubmitData = preShippingSubmitData;
                    // enable the next:Payment button here
                    $('body').trigger('checkout:enableButton', '.next-step-button button');
                    shippingHelpers.methods.shippingFormResponse(defer, data);
                },
                error: function (err) {
                    // form.spinner().stop();
                    $.spinner().stop();
                    // enable the next:Payment button here
                    $('body').trigger('checkout:enableButton', '.next-step-button button');
                    if (err.responseJSON && err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    }
                    // Server error submitting form
                    defer.reject(err.responseJSON);
                }
            });
        }
        return defer;
    },

    handlePaymentStage: function handlePaymentStage(e, defer, extraPostData) {
        //
        // Submit the Billing Address Form
        //

        formHelpers.clearPreviousErrors('.payment-form');

        var $billingForm = $('#dwfrm_billing');

        var billingAddressForm = $billingForm.find('.billing-address-block :input').serialize();

        $('body').trigger('checkout:serializeBilling', {
            form: $billingForm.find('.billing-address-block'),
            data: billingAddressForm,
            callback: function (data) {
                if (data) {
                    billingAddressForm = data;
                }
            }
        });

        var contactInfoForm = $billingForm.find('.contact-info-block :input').serialize();

        $('body').trigger('checkout:serializeBilling', {
            form: $billingForm.find('.contact-info-block'),
            data: contactInfoForm,
            callback: function (data) {
                if (data) {
                    contactInfoForm = data;
                }
            }
        });

        // there may be other tabs so we need to be more specific (i.e. BOPIS) and this only applies to payment tabs
        var activeTabId = $('.payment-options-block .tab-pane.active').attr('id');
        var paymentInfoSelector = '#dwfrm_billing .' + activeTabId + ' .payment-form-fields :input';
        var paymentInfoForm = $(paymentInfoSelector).serialize();

        $('body').trigger('checkout:serializeBilling', {
            form: $(paymentInfoSelector),
            data: paymentInfoForm,
            callback: function (data) {
                if (data) {
                    paymentInfoForm = data;
                }
            }
        });

        var paymentForm = billingAddressForm + '&' + contactInfoForm + '&' + paymentInfoForm;
        var ccForm = module.exports.validateAndSerializeCreditCard(defer);
        if (defer.state() === 'rejected') {
            return defer;
        }
        if (ccForm) {
            paymentForm += ccForm
        }

        if (extraPostData) {
            paymentForm += '&' + $.param(extraPostData);
        }

        // disable the next:Place Order button here
        $('body').trigger('checkout:disableButton', '.next-step-button button');

        var url = module.exports.getSubmitPaymentUrl(e);
        // $billingForm.spinner().start();
        $.spinner().start();
        recaptcha.check(e, {
            beforeSend: () => $billingForm.triggerHandler('validate'),
            url: url,
            method: 'POST',
            data: paymentForm,
            success: function (data) {
                // look for field validation errors
                // $billingForm.spinner().stop();
                $.spinner().stop();
                if (data.error) {
                    // enable the next:Place Order button here
                    $('body').trigger('checkout:enableButton', '.next-step-button button');
                    if (data.fieldErrors.length) {
                        data.fieldErrors.forEach(function (error) {
                            if (Object.keys(error).length) {
                                formHelpers.loadFormErrors('.payment-form', error);
                            }
                        });
                        $('.btn-show-details').trigger('click');
                        scrollToFieldError(data);
                    }

                    if (data.serverErrors.length) {
                        data.serverErrors.forEach(function (error) {
                            $('.error-message').show();
                            $('.error-message-text').text(error);
                            scrollAnimate($('.error-message'));
                        });
                    }

                    if (data.cartError) {
                        window.location.href = data.redirectUrl;
                    }

                    defer.reject();
                } else {
                    module.exports.handleSubmitPaymentSuccess(e, data, defer);
                }
            },
            error: function (err) {
                // enable the next:Place Order button here
                // $billingForm.spinner().stop();
                $.spinner().stop();
                $('body').trigger('checkout:enableButton', '.next-step-button button');
                if (err.responseJSON && err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }

                defer.reject();
            }
        });

        return defer;
    },

    getSubmitPaymentUrl: function getSubmitPaymentUrl(e) {
        return $('#dwfrm_billing').attr('action')
    },

    handleSubmitPaymentSuccess: function handleSubmitPaymentSuccess(e, data, defer) {
        if (window && window.CachedData && window.CachedData.skipReviewStepInCheckout) {
            return module.exports.handlePlaceOrderStage(e, defer);
        }

        // enable the next:Place Order button here
        // $('body').trigger('checkout:enableButton', '.next-step-button button');

        //
        // Populate the Address Summary
        //
        $('body').trigger('checkout:updateCheckoutView', {
            order: data.order,
            customer: data.customer
        });

        if (data.renderedPaymentInstruments) {
            $('.stored-payments').empty().html(
                data.renderedPaymentInstruments
            );
        }

        if (data.customer.registeredUser &&
            data.customer.customerPaymentInstruments &&
            data.customer.customerPaymentInstruments.length
        ) {
            $('.cancel-new-payment').removeClass('checkout-hidden');
        }

        defer.resolve(data);
        scrollAnimate();
    },

    handlePlaceOrderStage: function handlePlaceOrderStage(e, defer, postData) {
        // disable the placeOrder button here
        var placeOrderButton = $('.place-order');
        $('body').trigger('checkout:disableButton', '.next-step-button button');
        $('body').trigger('checkout:beforePlaceOrder', placeOrderButton);
        $.spinner().start();
        recaptcha.check(e, {
            url: placeOrderButton.data('action'),
            data: postData,
            method: 'POST',
            success: function (data) {
                $('body').trigger('checkout:afterPlaceOrder', data);
                $.spinner().stop();
                if (data.error) {
                    // enable the placeOrder button here
                    $('body').trigger('checkout:enableButton', '.next-step-button button');
                    if (data.cartError) {
                        window.location.href = data.redirectUrl;
                        defer.reject();
                    } else {
                        // go to appropriate stage and display error message
                        toastHelpers.methods.show('danger', data.errorMessage, false);
                        defer.reject(data);
                    }
                } else {
                    module.exports.handlePlaceOrderSuccess(e, data);
                }
            },
            error: function (err) {
                // enable the placeOrder button here
                $.spinner().stop();
                $('body').trigger('checkout:enableButton', $('.next-step-button button'));
                if (err.responseJSON && err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
            }
        });

        return defer;
    },

    handlePlaceOrderSuccess: function handlePlaceOrderSuccess (e, data) {
        if (data.returnEarly) {
            //Used by cybersource/adyen and others to indicate a redirect to somewhere other than Order-Confirm
            var continueUrl = data.continueUrl;
            window.location.href = data.continueUrl;
        } else {
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
    }
};
