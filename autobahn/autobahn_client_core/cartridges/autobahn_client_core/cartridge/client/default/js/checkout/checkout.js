'use strict';

var integrationsCheckoutCheckout = require('integrations/checkout/checkout');

var billing = require('integrations/checkout/billing');
var checkoutPlugin = require('./checkoutPlugin');
var customerEmailCheck = require('./customerEmailCheck');
var toastHelpers = require('core/components/toast');
var members = require('integrations/checkout/plugin/members');
var STRIPE_CHECKOUT_ERROR_STORAGE_KEY = 'stripe_checkout_error_message';

// Performance: Simple debounce utility
function debounce(func, wait) {
    var timeout;
    return function executedFunction() {
        var context = this;
        var args = arguments;
        var later = function() {
            timeout = null;
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Performance: Cache frequently used DOM queries
var $checkoutMain, $reviewOrderBtn, $inputWrapper;

function getTermsConsentCheckbox() {
    var $termsCheckbox = $('#place-order-terms-condition');

    if ($termsCheckbox.length) {
        return $termsCheckbox.first();
    }

    return $('.place-order-check input[type="checkbox"]').first();
}

function syncPlaceOrderConsentState() {
    var $termsCheckbox = getTermsConsentCheckbox();
    var $placeOrderButtons = $('.next-step-button .place-order, .place-order, button[value="place-order"]');

    if (!$placeOrderButtons.length) {
        return;
    }

    if ($termsCheckbox.length && $termsCheckbox.is(':checked')) {
        $placeOrderButtons.prop('disabled', false).removeClass('disabled');
        $('body').trigger('checkout:enableButton', '.next-step-button .place-order');
    } else {
        $placeOrderButtons.prop('disabled', true).addClass('disabled');
        $('body').trigger('checkout:disableButton', '.next-step-button .place-order');
    }
}

// Performance: Lazy load accordion panels and order summary
function lazyLoadCheckoutContent() {
    if (!window.IntersectionObserver) {
        // Fallback for browsers without IntersectionObserver
        return;
    }
    
    var lazyElements = document.querySelectorAll('[data-lazy-load="true"]');
    if (lazyElements.length === 0) return;
    
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var element = entry.target;
                // Mark as loaded to prevent re-processing
                element.setAttribute('data-lazy-loaded', 'true');
                
                // Use requestIdleCallback for non-critical content
                if (window.requestIdleCallback) {
                    requestIdleCallback(function() {
                        element.classList.add('lazy-loaded');
                    }, { timeout: 1000 });
                } else {
                    setTimeout(function() {
                        element.classList.add('lazy-loaded');
                    }, 100);
                }
                
                observer.unobserve(element);
            }
        });
    }, {
        rootMargin: '200px', // Start loading 200px before element is visible
        threshold: 0.01
    });
    
    lazyElements.forEach(function(element) {
        observer.observe(element);
    });
}

// Performance: Consolidate all initialization into single DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
    // Cache frequently used selectors
    $checkoutMain = $('#checkout-main');
    $reviewOrderBtn = $('.btn.btn-primary.btn-block.submit-payment');
    $inputWrapper = $('.giftcertificate-information .giftCertificate-input-wrapper');
    
    // Performance: Initialize lazy loading for non-critical sections
    if (window.requestIdleCallback) {
        requestIdleCallback(lazyLoadCheckoutContent, { timeout: 500 });
    } else {
        setTimeout(lazyLoadCheckoutContent, 200);
    }

    // Performance: Use event delegation for shipping submit button
    $(document).on('click', '.submit-shipping', function () {
        var shippingRequiredFields = document.querySelectorAll('.shipping-address-block .form-group.required');
        for (var i = 0; i < shippingRequiredFields.length; i++) {
            var shippingGroup = shippingRequiredFields[i];
            var shippingInput = shippingGroup.querySelector('input, select');
            if (shippingInput && (shippingInput.value || '').trim() === '') {
                shippingInput.focus();
                break;
            }
        }
    });

    // Performance: Initialize accordions immediately (critical for initial render)
    initCheckoutAccordions();
    
    // Performance: Defer order summary initialization until after critical rendering
    if (window.requestIdleCallback) {
        requestIdleCallback(function() {
            var orderSummary = document.querySelector('.checkout-order-summary');
            if (orderSummary && !orderSummary.hasAttribute('data-initialized')) {
                orderSummary.setAttribute('data-initialized', 'true');
                // Trigger any order summary specific initialization here if needed
            }
        }, { timeout: 1000 });
    }

    // Performance: Use event delegation for accordion buttons with passive listeners
    $(document).on("click", "#customer .accordion-button, #shipping .accordion-button", function () {
        var checkoutStage = $checkoutMain.attr('data-checkout-stage');
        var $parentAccordion = $(this).closest(".accordion");

        // Prevent toggle if animation is still in progress
        if ($(".panel").is(":animated")) {
            return;
        }

        var currentId = $parentAccordion.attr('id');

        // Prevent re-clicking on the current active stage
        if (checkoutStage === currentId) {
            return;
        }

        // Performance: Use requestAnimationFrame for smoother animations
        requestAnimationFrame(function() {
            // Toggle current panel
            if ($parentAccordion.hasClass("active")) {
                $parentAccordion.removeClass("active");
                $parentAccordion.find(".panel").slideUp();
            } else {
                $parentAccordion.addClass("active");
                $parentAccordion.find(".panel").slideDown();
                
                // Performance: Lazy load content when accordion opens
                var lazyContent = $parentAccordion.find('[data-lazy-content="true"]');
                if (lazyContent.length && !lazyContent.hasClass('lazy-loaded')) {
                    lazyContent.addClass('lazy-loaded');
                }
            }
        });
    });

    // Performance: Use event delegation for place order terms
    $(document).on('change', '#place-order-terms-condition, .place-order-check input[type="checkbox"]', function() {
        syncPlaceOrderConsentState();
    });

    // Hard guard: never allow place order click without consent.
    $(document).on('click', '.next-step-button .place-order, .place-order, button[value="place-order"]', function (e) {
        var $termsCheckbox = getTermsConsentCheckbox();

        if (!$termsCheckbox.length || !$termsCheckbox.is(':checked')) {
            e.preventDefault();
            e.stopImmediatePropagation();
            syncPlaceOrderConsentState();
        }
    });

    // Capture-phase guard blocks place order before any other click handlers fire.
    document.addEventListener('click', function (e) {
        var target = e.target;
        var placeOrderButton = target && target.closest
            ? target.closest('.next-step-button .place-order, .place-order, button[value="place-order"]')
            : null;

        if (!placeOrderButton) {
            return;
        }

        var $termsCheckbox = getTermsConsentCheckbox();
        if (!$termsCheckbox.length || !$termsCheckbox.is(':checked')) {
            e.preventDefault();
            e.stopPropagation();
            syncPlaceOrderConsentState();
        }
    }, true);

    // Ensure initial state is disabled until terms are checked.
    syncPlaceOrderConsentState();

    // Re-apply state after checkout view refreshes/rerenders.
    $('body').on('checkout:updateCheckoutView', function () {
        syncPlaceOrderConsentState();
    });

    // Keep billing address editable in custom checkout layer without changing base cartridge bindings.
    $(document).on('click', '#add-new-billing', function () {
        var $form = $(this).closest('form[data-address-mode], form[data-billing-address-mode]');
        $form.attr('data-address-mode', 'new');
        $form.attr('data-billing-address-mode', 'new');
    });

    $(document).on('click', '#show-billing-details', function () {
        var $form = $(this).closest('form[data-address-mode], form[data-billing-address-mode]');
        $form.attr('data-address-mode', 'new');
        $form.attr('data-billing-address-mode', 'new');
    });

    // Performance: Debounce gift certificate input handler
    var debouncedGiftCertInput = debounce(function(inputVal) {
        $inputWrapper.removeClass('is-valid is-invalid');
        if (inputVal !== '') {
            $inputWrapper.find('.clear_giftcertificate_input').removeClass('d-none');
        } else {
            $inputWrapper.find('.clear_giftcertificate_input').addClass('d-none');
        }
        $('.giftcertificate-information .invalid-feedback').text('');
        $reviewOrderBtn.attr('disabled', false);
    }, 150);

    // Performance: Use event delegation for gift certificate input
    $(document).on('input', '.giftcertificate-information input#giftcertificateid', function() {
        var inputVal = $(this).val();
        debouncedGiftCertInput(inputVal);
    });

    // Performance: Use event delegation for gift certificate clear button
    $(document).on('click', '.giftcertificate-information .clear_giftcertificate_input', function() {
        $('.giftcertificate-information .clear_giftcertificate_input').addClass('d-none');
        $('.giftcertificate-information input#giftcertificateid').val('');
        $('.giftcertificate-information .invalid-feedback').text('');
        $inputWrapper.removeClass('is-valid is-invalid');
        $reviewOrderBtn.attr('disabled', false);
    });

    // Performance: Use event delegation for password toggle
    $(document).on('keydown', '#togglePasswordLogin', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            $(this).click();
            var isPressed = $(this).attr('aria-pressed') === 'true';
            $(this)
                .attr('aria-pressed', !isPressed)
                .attr('aria-label', !isPressed ? 'Hide password' : 'Show password');
        }
    });

    // Performance: Defer password visibility toggles (non-critical)
    if (window.requestIdleCallback) {
        requestIdleCallback(function() {
            initPasswordToggles();
        }, { timeout: 500 });
    } else {
        setTimeout(initPasswordToggles, 200);
    }

    // Performance: Use event delegation for edit and save buttons
    $(document).on('click', '.edit-button', function () {
        var $summary = $(this).closest('.card-header').next('.summary-details.customer');
        $summary.find('.customer-email-input').val($summary.find('.customer-summary-email').text().trim());
        $summary.find('.customer-summary-email').hide();
        $summary.find('.customer-email-input, .save-email-button').show();
    });

    $(document).on('click', '.save-email-button', function (e) {
        e.preventDefault();
        handleEmailSave($(this));
    });
});

// Performance: Extract functions for better code organization and lazy loading
function initCheckoutAccordions() {
    var checkoutStage = $checkoutMain.data('checkout-stage');
    
    if (checkoutStage) {
        var $stageElement = $('#' + checkoutStage);
        $stageElement.addClass("active");
        $stageElement.find(".panel").slideDown();

        if (checkoutStage === "shipping") {
            $('#customer .panel, #payment .panel').slideUp();
        }

        if (checkoutStage === "payment" || checkoutStage === "placeOrder") {
            $('#payment').addClass("active");
            $('#customer .panel, #shipping .panel').slideUp();
            $(document).off("click", "#payment .accordion-button"); 
        }
    } else {
        var $firstAccordion = $(".accordion").first();
        $firstAccordion.addClass("active");
        $firstAccordion.find(".panel").slideDown();
    }
}

function initPasswordToggles() {
    function togglePasswordVisibility(buttonId, inputId) {
        $(document).on("click", buttonId, function () {
            $(this).toggleClass("icon-Hide icon-Show");
            var type = $(inputId).attr("type") === "password" ? "text" : "password";
            $(inputId).attr("type", type);
        });
    }
    togglePasswordVisibility("#togglePassword", "#registration-form-password");
    togglePasswordVisibility("#togglePasswordLogin", "#password");
}

function handleEmailSave($button) {
    var $summary = $button.closest('.summary-details.customer');
    var emailInput = $summary.find('.customer-email-input');
    var newEmail = emailInput.val().trim();
    $('.order-summary-email').text(newEmail);

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        toastHelpers.methods.show('danger', 'Please enter a valid email address.', false);
        return;
    }

    var checkEmailUrl = emailInput.data('checkemail');
    var submitCustomerUrl = $('#guest-customer').attr('action');
    var csrfInput = $('#guest-customer input[type="hidden"][name^="csrf_"]');
    var csrfName = csrfInput.attr('name');
    var csrfToken = csrfInput.val();

    // Step 1: Call CheckEmail
    $.get(checkEmailUrl, { email: newEmail }, function (response) {
        if (response.existingCustomer) {
            toastHelpers.methods.show('danger', response.msg || 'Email already exists.', false);
            members.gotoStage('customer');
            $('.js-login-customer').trigger('click');
            var guestEmail = $('.customer-email-input').val();
            $('#email').val(guestEmail);
            $summary.find('.customer-summary-email').text(newEmail).show();
            $summary.find('.customer-email-input, .save-email-button').hide();
            return;
        }

        $summary.find('.customer-summary-email').text(newEmail).show();
        $summary.find('.customer-email-input, .save-email-button').hide();
        toastHelpers.methods.show('success', 'Email updated successfully.', false);

        // Step 2: Call SubmitCustomer
        var payload = {};
        payload['dwfrm_coCustomer_email'] = newEmail;
        payload[csrfName] = csrfToken;

        $.ajax({
            url: submitCustomerUrl,
            type: 'POST',
            data: payload,
            success: function (res) {
                if (res.error) {
                    toastHelpers.methods.show('danger', res.errorMessage || 'Failed to update email.', false);
                }
            },
            error: function () {
                toastHelpers.methods.show('danger', 'Server error while updating email.', false);
            }
        });
    });
}

// Performance: Optimize popstate handler
function getStageFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get('stage');
}

function isPayPalReturnFlow() {
    var search = window.location.search || '';

    if (!search) {
        return false;
    }

    var params = new URLSearchParams(search);

    return (params.has('token') && params.has('PayerID'))
        || params.has('ba_token')
        || params.has('paypal_checkout');
}

function showStandardCheckoutLoaderOnPayPalReturn() {
    if (typeof $.spinner !== 'function' || !isPayPalReturnFlow()) {
        return;
    }

    var checkoutMain = document.getElementById('checkout-main');
    var billingForm = document.getElementById('dwfrm_billing');

    // Run loader only on checkout payment context, never on order confirmation.
    if (!checkoutMain || !billingForm) {
        return;
    }

    var checkoutStage = checkoutMain.getAttribute('data-checkout-stage');
    if (checkoutStage && checkoutStage !== 'payment' && checkoutStage !== 'placeOrder') {
        return;
    }

    var spinner = $.spinner();

    function showSpinner() {
        if (!document.querySelector('.veil')) {
            spinner.start();
        }
    }

    function stopSpinner() {
        spinner.stop();
    }

    showSpinner();

    $('body').one('checkout:updateCheckoutView', function () {
        stopSpinner();
    });

    $('body').one('checkout:enableButton', function () {
        stopSpinner();
    });

    window.addEventListener('pageshow', function () {
        stopSpinner();
    }, { once: true });

    window.setTimeout(stopSpinner, 30000);

    $(window).on('beforeunload', function () {
        showSpinner();
    });
}

function isStripePaymentUiContext() {
    return !!document.getElementById('dwfrm_billing')
        && (
            !!document.getElementById('payment-element')
            || !!document.querySelector('.payment-options [data-method-id="STRIPE_PAYMENT_ELEMENT"]')
            || !!document.querySelector('.payment-options [data-method-id="CREDIT_CARD"]')
            || !!document.querySelector('input[name="stripe_source_id"]')
        );
}

function renderStripeCheckoutInlineError(message) {
    var fallbackMessage = 'Your card was declined. Please use a different card or payment method.';
    var safeMessage = message || fallbackMessage;
    var $paymentInfo = $('.js-payment-information').first();
    var $container = $paymentInfo.length
        ? $paymentInfo
        : $('.payment-form .payment-options-block, .payment-form, #dwfrm_billing').first();

    if (!$container.length) {
        return;
    }

    var $anchor = $container.find('.payment-options-heading').first();
    if (!$anchor.length) {
        $anchor = $container.find('.payment-options').first();
    }

    var $error = $('.stripe-checkout-error-message');
    if (!$error.length) {
        $error = $(
            '<div class="alert alert-danger stripe-checkout-error-message" role="alert" aria-live="polite">'
            + '<button type="button" class="close stripe-checkout-error-close" aria-label="Close">'
            + '<span aria-hidden="true">&times;</span>'
            + '</button>'
            + '<span class="stripe-checkout-error-text"></span>'
            + '</div>'
        );
    }

    if ($anchor.length) {
        $error.insertBefore($anchor);
    } else {
        $container.prepend($error);
    }

    $error.find('.stripe-checkout-error-text').text(safeMessage);
    $error.show();

    if (window.sessionStorage) {
        window.sessionStorage.setItem(STRIPE_CHECKOUT_ERROR_STORAGE_KEY, safeMessage);
    }

    var cardErrors = document.getElementById('card-errors');
    if (cardErrors) {
        cardErrors.textContent = safeMessage;
    }

    if ($error.length && typeof $error[0].scrollIntoView === 'function') {
        window.setTimeout(function () {
            $error[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 0);
    }
}

function hideStripeCheckoutInlineError(clearStorage) {
    var $error = $('.stripe-checkout-error-message');

    if ($error.length) {
        $error.hide();
    }

    if (clearStorage && window.sessionStorage) {
        window.sessionStorage.removeItem(STRIPE_CHECKOUT_ERROR_STORAGE_KEY);
    }
}

function restoreStripeCheckoutInlineError() {
    if (!window.sessionStorage) {
        return;
    }

    var savedMessage = window.sessionStorage.getItem(STRIPE_CHECKOUT_ERROR_STORAGE_KEY);
    if (!savedMessage) {
        return;
    }

    window.sessionStorage.removeItem(STRIPE_CHECKOUT_ERROR_STORAGE_KEY);
    renderStripeCheckoutInlineError(savedMessage);
}

function installStripeAlertToInlineErrorBridge() {
    if (!isStripePaymentUiContext() || !window.alert || window.__stripeAlertBridgeInstalled) {
        return;
    }

    window.__stripeAlertBridgeInstalled = true;
    var originalAlert = window.alert.bind(window);

    window.alert = function (message) {
        var messageText = (message || '').toString();
        var selectedStripeMethod = (window.localStorage && window.localStorage.getItem('stripe_payment_method')) || '';
        var isStripeMethod = selectedStripeMethod === 'STRIPE_PAYMENT_ELEMENT'
            || selectedStripeMethod === 'CREDIT_CARD'
            || selectedStripeMethod === 'BANK_TRANSFER';
        var looksLikeStripeDecline = /declin|insufficient|payment method|authentication|cvc|security code|card|stripe/i.test(messageText);

        if (isStripePaymentUiContext() && messageText && (isStripeMethod || looksLikeStripeDecline)) {
            renderStripeCheckoutInlineError(messageText);
            return;
        }

        originalAlert(message);
    };
}

function collectStringValuesDeep(value, bag) {
    if (!value) {
        return;
    }

    if (typeof value === 'string') {
        var normalized = value.trim();
        if (normalized) {
            bag.push(normalized);
        }
        return;
    }

    if (Array.isArray(value)) {
        value.forEach(function (item) {
            collectStringValuesDeep(item, bag);
        });
        return;
    }

    if (typeof value === 'object') {
        Object.keys(value).forEach(function (key) {
            collectStringValuesDeep(value[key], bag);
        });
    }
}

function extractStripeDeclineMessage(payload) {
    if (!payload || typeof payload !== 'object') {
        return '';
    }

    var messages = [];

    if (typeof payload.errorMessage === 'string') {
        messages.push(payload.errorMessage);
    }

    if (typeof payload.message === 'string') {
        messages.push(payload.message);
    }

    if (Array.isArray(payload.serverErrors)) {
        payload.serverErrors.forEach(function (msg) {
            if (typeof msg === 'string') {
                messages.push(msg);
            }
        });
    }

    if (Array.isArray(payload.fieldErrors)) {
        payload.fieldErrors.forEach(function (fieldError) {
            collectStringValuesDeep(fieldError, messages);
        });
    }

    collectStringValuesDeep(payload.order, messages);
    collectStringValuesDeep(payload.error, messages);

    var prioritized = messages.find(function (msg) {
        return /your card was declined/i.test(msg);
    });
    if (prioritized) {
        return prioritized;
    }

    var stripeLike = messages.find(function (msg) {
        return /(declin|insufficient|authentication|3d secure|security code|cvc|card|payment intent|stripe)/i.test(msg);
    });

    return stripeLike || '';
}

function installStripeAjaxErrorExtractor() {
    if (window.__stripeAjaxErrorExtractorInstalled) {
        return;
    }

    window.__stripeAjaxErrorExtractorInstalled = true;

    $(document).ajaxComplete(function (_event, xhr, settings) {
        if (!isStripePaymentUiContext() || !xhr) {
            return;
        }

        var url = (settings && settings.url ? settings.url : '').toString();
        var selectedStripeMethod = (window.localStorage && window.localStorage.getItem('stripe_payment_method')) || '';
        var isStripeMethod = selectedStripeMethod === 'STRIPE_PAYMENT_ELEMENT'
            || selectedStripeMethod === 'CREDIT_CARD'
            || selectedStripeMethod === 'BANK_TRANSFER';
        var isStripeEndpoint = /stripe|paymentelementsubmitorder|cardpaymentsubmitorder|submitpayment/i.test(url);

        if (!isStripeMethod && !isStripeEndpoint) {
            return;
        }

        var payload = xhr.responseJSON;
        if (!payload && xhr.responseText) {
            try {
                payload = JSON.parse(xhr.responseText);
            } catch (e) {
                payload = null;
            }
        }

        if (!payload || typeof payload !== 'object') {
            return;
        }

        if (!payload.error && !payload.serverErrors && !payload.fieldErrors) {
            return;
        }

        var declineMessage = extractStripeDeclineMessage(payload);
        if (declineMessage) {
            renderStripeCheckoutInlineError(declineMessage);
        }
    });
}

function installStripeInlineErrorDismissBehaviors() {
    if (window.__stripeInlineErrorDismissInstalled) {
        return;
    }

    window.__stripeInlineErrorDismissInstalled = true;

    $(document).on('click', '.stripe-checkout-error-close', function (event) {
        event.preventDefault();
        hideStripeCheckoutInlineError(true);
    });

    // Hide decline message as soon as shopper starts editing payment-related fields.
    $(document).on('input change keydown', '#dwfrm_billing .payment-form-fields input, #dwfrm_billing .payment-form-fields select, #dwfrm_billing .payment-form-fields textarea', function () {
        hideStripeCheckoutInlineError(true);
    });

    // Stripe Elements are rendered in iframes; use container interaction as closest UX signal.
    $(document).on('click focusin', '#card-number-element, #card-expiry-element, #card-cvc-element, #payment-element, #stripe-bank-transfer-element', function () {
        hideStripeCheckoutInlineError(true);
    });

    $(document).on('change click', 'input[name="saved_card_id"], .payment-options .nav-link, .payment-options .nav-item', function () {
        hideStripeCheckoutInlineError(true);
    });
}

function updateSavedStripeCardHiddenInputs(savedCard) {
    if (!savedCard || !savedCard.value) {
        return;
    }

    $('input[name="stripe_source_id"]').val(savedCard.value);
    $('#stripe_source_id').val(savedCard.value);
    $('#dwfrm_billing_creditCardFields_selectedCardID').val(savedCard.value);

    if (savedCard.dataset && savedCard.dataset.cardtype) {
        var cardType = savedCard.dataset.cardtype;
        var capitalizedType = cardType.charAt(0).toUpperCase() + cardType.slice(1);
        $('#cardType').val(capitalizedType);
        // stripeCreditHelper/cardsHelper read stripe_card_type from httpParameterMap
        $('#stripe_card_type').val(cardType);
        $('input[name="stripe_card_type"]').val(cardType);
    }

    if (savedCard.dataset && savedCard.dataset.cardnumber) {
        $('#stripe_card_number').val(savedCard.dataset.cardnumber);
        $('input[name="stripe_card_number"]').val(savedCard.dataset.cardnumber);
    }

    if (savedCard.dataset && savedCard.dataset.cardholder) {
        $('#stripe_card_holder').val(savedCard.dataset.cardholder);
        $('input[name="stripe_card_holder"]').val(savedCard.dataset.cardholder);
    }

    if (savedCard.dataset && savedCard.dataset.cardexpmonth) {
        $('#stripe_card_expiration_month').val(savedCard.dataset.cardexpmonth);
        $('input[name="stripe_card_expiration_month"]').val(savedCard.dataset.cardexpmonth);
    }

    if (savedCard.dataset && savedCard.dataset.cardexpyear) {
        $('#stripe_card_expiration_year').val(savedCard.dataset.cardexpyear);
        $('input[name="stripe_card_expiration_year"]').val(savedCard.dataset.cardexpyear);
    }
}

function getActivePaymentMethodValueFromDom() {
    var activeTabId = $('.tab-pane.active').attr('id');

    if (!activeTabId) {
        return $('#selectedPaymentOption').val() || '';
    }

    var paymentMethodSelector = '#dwfrm_billing .' + activeTabId + ' .payment-form-fields input[name$="_paymentMethod"]';
    var paymentMethodInput = $(paymentMethodSelector).first();

    if (!paymentMethodInput.length) {
        paymentMethodSelector = '#dwfrm_billing .' + activeTabId + ' .payment-form-fields input.form-control[name*="paymentMethod"]';
        paymentMethodInput = $(paymentMethodSelector).first();
    }

    if (paymentMethodInput.length && paymentMethodInput.val()) {
        return paymentMethodInput.val();
    }

    return $('#selectedPaymentOption').val() || '';
}

function installStripeSavedCardSubmitGuard() {
    if (window.__stripeSavedCardSubmitGuardInstalled) {
        return;
    }

    window.__stripeSavedCardSubmitGuardInstalled = true;

    // Capture-phase only: sync saved-card fields before SFRA SubmitPayment.
    // Do NOT clone the Review Order button (that stripped other listeners) and
    // do NOT stopPropagation for saved cards — CheckoutServices-SubmitPayment must run.
    document.addEventListener('click', function (event) {
        var submitButton = event.target && event.target.closest
            ? event.target.closest('button.submit-payment')
            : null;

        if (!submitButton) {
            return;
        }

        var getMethod = window.getActivePaymentMethodValue;
        var selectedPaymentMethod = typeof getMethod === 'function'
            ? getMethod()
            : getActivePaymentMethodValueFromDom();

        // Prefer Stripe helpers when present (more reliable after tab switches).
        if ((!selectedPaymentMethod || selectedPaymentMethod === 'PayPal')
            && typeof window.getSelectedPaymentMethod === 'function') {
            selectedPaymentMethod = window.getSelectedPaymentMethod() || selectedPaymentMethod;
        }

        if (selectedPaymentMethod === 'STRIPE_PAYMENT_ELEMENT') {
            window.localStorage.setItem('stripe_payment_method', 'STRIPE_PAYMENT_ELEMENT');
            return;
        }

        if (selectedPaymentMethod === 'BANK_TRANSFER') {
            window.localStorage.setItem('stripe_payment_method', 'BANK_TRANSFER');
            return;
        }

        if (selectedPaymentMethod !== 'CREDIT_CARD') {
            return;
        }

        window.localStorage.setItem('stripe_payment_method', 'CREDIT_CARD');

        var savedCardsContainer = document.getElementById('saved-cards-container');
        var newCardForm = document.getElementById('new-card-form-container');
        var savedCard = document.querySelector('input[name=saved_card_id]:checked');
        var isSavedCardsView = savedCardsContainer
            && savedCardsContainer.style.display !== 'none'
            && (!newCardForm || newCardForm.style.display === 'none'
                || (window.getComputedStyle && window.getComputedStyle(newCardForm).display === 'none'));

        if (savedCard && savedCard.value && isSavedCardsView) {
            updateSavedStripeCardHiddenInputs(savedCard);
        }
    }, true);
}

function ensureActivePaymentTabVisible() {
    var activeLink = document.querySelector('.payment-options .nav-item .nav-link.active');
    if (activeLink && typeof activeLink.scrollIntoView === 'function') {
        activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
}

function ensurePaymentMethodsHeading() {
    var paymentInfoContainer = document.querySelector('.js-payment-information');
    if (!paymentInfoContainer || paymentInfoContainer.querySelector('.payment-options-heading')) {
        return;
    }

    var paymentTabs = paymentInfoContainer.querySelector('.payment-options');
    if (!paymentTabs) {
        return;
    }

    var heading = document.createElement('p');
    heading.className = 'payment-options-heading form-control-label';
    heading.textContent = 'Payment Methods';

    paymentInfoContainer.insertBefore(heading, paymentTabs);
}

function enableReviewOrderButton() {
    var reviewOrderButtons = document.querySelectorAll('button.submit-payment, .next-step-button .submit-payment');

    if (!reviewOrderButtons.length) {
        return;
    }

    var $activeLink = $('.payment-options .nav-link.active').first();
    var activeMethodId = ($activeLink.closest('.nav-item').data('method-id')
        || $activeLink.data('method-id')
        || $('.payment-information').data('payment-method-id')
        || '');
    var isPayPalTab = String(activeMethodId).toLowerCase() === 'paypal';

    reviewOrderButtons.forEach(function (button) {
        var container = button.closest('.next-step-button');

        if (isPayPalTab) {
            // PayPal uses its own Smart Buttons — keep Review Order hidden on this tab
            // (first visit and after returning from review).
            button.style.display = 'none';
            button.classList.add('d-none');
            button.setAttribute('hidden', 'hidden');
            return;
        }

        button.disabled = false;
        button.removeAttribute('disabled');
        button.classList.remove('disabled');
        button.classList.remove('none');
        button.classList.remove('d-none');
        button.removeAttribute('hidden');

        if (button.style && button.style.display === 'none') {
            button.style.display = '';
        }

        if (container) {
            container.classList.remove('none');
            container.classList.remove('d-none');
            container.removeAttribute('hidden');

            if (container.style && container.style.display === 'none') {
                container.style.display = '';
            }
        }
    });

    if (!isPayPalTab) {
        $('body').trigger('checkout:enableButton', '.next-step-button .submit-payment');
    }
}

function sanitizePaymentSummaryText() {
    var paymentDetails = document.querySelectorAll('.payment-details');

    if (!paymentDetails.length) {
        return;
    }

    paymentDetails.forEach(function (container) {
        if (!container || !container.innerHTML) {
            return;
        }

        container.innerHTML = container.innerHTML.replace(/\bundefined\b/g, '').replace(/\s{2,}/g, ' ');
    });
}

function hasAmountDue(order) {
    var rawAmountDue = order
        && order.totals
        && order.totals.grandTotalLessGiftCertificatePaymentInstrumentsValue;

    if (typeof rawAmountDue === 'number') {
        return rawAmountDue > 0;
    }

    if (typeof rawAmountDue === 'string') {
        var parsedAmountDue = parseFloat(rawAmountDue.replace(/[^0-9.-]/g, ''));
        if (!Number.isNaN(parsedAmountDue)) {
            return parsedAmountDue > 0;
        }
    }

    return !!rawAmountDue;
}

function clearStalePaymentData() {
    var $billingForm = $('#dwfrm_billing');

    $billingForm.find('input[name="stripe_source_id"]').val('');
    $billingForm.find('#stripe_source_id').val('');
    $billingForm.find('#dwfrm_billing_creditCardFields_selectedCardID').val('');
    $billingForm.find('#selectedCardID').val('');
    $billingForm.find('#stripe_card_type').val('');
    $billingForm.find('#stripe_card_number').val('');
    $billingForm.find('#stripe_card_holder').val('');
    $billingForm.find('#stripe_card_expiration_month').val('');
    $billingForm.find('#stripe_card_expiration_year').val('');
    $billingForm.find('input[name$="_securityCode"]').val('');

    var $cardNumberInput = $billingForm.find('input[name$="_cardNumber"]');
    var cardNumberCleave = $cardNumberInput.data('cleave');
    if (cardNumberCleave && typeof cardNumberCleave.setRawValue === 'function') {
        cardNumberCleave.setRawValue('');
    } else {
        $cardNumberInput.val('');
    }
}

function ensureReviewOrderContainerBinding() {
    var $submitOrderBtn = $('#checkout-main').find('#submit-order');
    var checkoutStage = ($('#checkout-main').attr('data-checkout-stage')
        || $('.data-checkout-stage').attr('data-checkout-stage')
        || '');

    if (!$submitOrderBtn.length) {
        return;
    }

    if (!$submitOrderBtn.closest('.next-step-button').length) {
        $submitOrderBtn.parent().addClass('next-step-button');
    }

    // Never force-enable Place Order while shopper is on the payment step —
    // that made CheckoutServices-PlaceOrder fire instead of SubmitPayment.
    if (checkoutStage === 'payment') {
        $submitOrderBtn.prop('disabled', true).attr('disabled', 'disabled');
        return;
    }

    $submitOrderBtn.prop('disabled', false).removeAttr('disabled');
}

function syncGiftCertificateOnlyState(data) {
    var order = data && data.order;
    if (!order || !order.totals) {
        return;
    }

    var amountDue = hasAmountDue(order);
    var hasGiftCertificate = !!order.totals.giftCertificatePaymentInstrumentsTotalValue;
    var $billingForm = $('#dwfrm_billing');
    var $giftTab = $('.payment-options .giftcertificate-tab');
    var $giftNavItem = $giftTab.closest('.nav-item');
    var $giftPane = $('#giftcertificate-content');

    $('body').trigger('PaymentMethodObserver:Show', { name: 'giftcertificate', show: hasGiftCertificate });

    if (!amountDue) {
        $('.payment-information').data('payment-method-id', 'GIFT_CERTIFICATE');
        $('.payment-information').attr('data-payment-method-id', 'GIFT_CERTIFICATE');
        $billingForm.find('#selectedPaymentOption').val('GIFT_CERTIFICATE');

        $('.nav-item.activepaypal').attr('data-auth', 're-auth');
        $('li[data-method-id="PAYPAL"]').removeClass('activepaypal');

        if ($giftNavItem.length) {
            $giftNavItem.removeAttr('hidden').removeClass('d-none').addClass('active');
            $('.payment-options .nav-item').not($giftNavItem).addClass('d-none').removeClass('active');
            $('.payment-options .nav-item .nav-link').not($giftTab).removeClass('active');
            $giftTab.addClass('active');
        }

        if ($giftPane.length) {
            $('.payment-options-block .tab-pane').not($giftPane).removeClass('active show');
            $giftPane.addClass('active show');
            $billingForm.find('.payment-options-block .tab-pane .payment-form-fields input[name$="_paymentMethod"]').prop('disabled', true);
            $billingForm.find('#giftcertificate-content .payment-form-fields input[name$="_paymentMethod"]').prop('disabled', false);
        }

        clearStalePaymentData();
        ensureReviewOrderContainerBinding();
        enableReviewOrderButton();
        return;
    }

    $('.payment-options .nav-item').removeClass('d-none');
    if ($giftNavItem.length) {
        $giftNavItem.attr('hidden', true).removeClass('active');
    }

    $billingForm.find('.payment-options-block .tab-pane .payment-form-fields input[name$="_paymentMethod"]').prop('disabled', false);
}

// Performance: Use passive event listener where possible
window.addEventListener('popstate', function () {
    var currentCheckoutStage = getStageFromUrl();
    if (currentCheckoutStage) {
        var $stageAccordion = $('#' + currentCheckoutStage);
        $('.accordion').removeClass('active').find('.panel').slideUp();
        $stageAccordion.addClass('active').find('.panel').slideDown();
    }
}, { passive: true });

// When a user navigates back/forward, the browser can restore the page from cache
window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
        initCheckoutAccordions();
    }
});

$(function () {
    installStripeAlertToInlineErrorBridge();
    installStripeAjaxErrorExtractor();
    installStripeInlineErrorDismissBehaviors();
    restoreStripeCheckoutInlineError();
    showStandardCheckoutLoaderOnPayPalReturn();
    installStripeSavedCardSubmitGuard();
    ensurePaymentMethodsHeading();
    ensureActivePaymentTabVisible();
    enableReviewOrderButton();
    sanitizePaymentSummaryText();

    $(document).on('click', '.payment-options .nav-item .nav-link', function () {
        window.setTimeout(function () {
            ensureActivePaymentTabVisible();
            enableReviewOrderButton();
        }, 0);
    });

    $('body').on('checkout:updateCheckoutView', function () {
        ensurePaymentMethodsHeading();
        ensureActivePaymentTabVisible();
        enableReviewOrderButton();
        sanitizePaymentSummaryText();
        syncGiftCertificateOnlyState(arguments[1]);
        ensureReviewOrderContainerBinding();

        // Run once more after third-party update handlers to win visibility races.
        window.setTimeout(function () {
            enableReviewOrderButton();
        }, 0);
    });

    $('body').on('checkout:updateCheckoutViewPaymentInformation', function () {
        sanitizePaymentSummaryText();
        syncGiftCertificateOnlyState(arguments[1]);
        ensureReviewOrderContainerBinding();
        enableReviewOrderButton();

        window.setTimeout(function () {
            enableReviewOrderButton();
        }, 0);
    });
});

window.addEventListener('pagehide', function (event) {
});

// Merge library methods
[billing, checkoutPlugin, customerEmailCheck].forEach(function (library) {
    Object.keys(library).forEach(function (key) {
        if (typeof library[key] === 'object') {
            integrationsCheckoutCheckout[key] = $.extend({}, integrationsCheckoutCheckout[key], library[key]);
        } else {
            integrationsCheckoutCheckout[key] = library[key];
        }
    });
});

module.exports = integrationsCheckoutCheckout;
