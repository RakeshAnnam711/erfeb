'use strict';

var integrationsCheckoutCheckout = require('integrations/checkout/checkout');

var billing = require('integrations/checkout/billing');
var checkoutPlugin = require('./checkoutPlugin');
var customerEmailCheck = require('./customerEmailCheck');
var toastHelpers = require('core/components/toast');
var members = require('integrations/checkout/plugin/members');

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
    $(document).on('change', '#place-order-terms-condition', function() {
        if ($(this).is(':checked')) {
            $('body').trigger('checkout:enableButton', '.next-step-button .place-order');
        } else {
            $('body').trigger('checkout:disableButton', '.next-step-button .place-order');
        }
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
