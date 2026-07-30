'use strict';

var integrations = require('integrations/checkout');
integrations.baseFiles.checkout = require('./checkout/checkout');
integrations.baseFiles.smartyAutocomplete = require('./components/smarty');

// Performance: Use event delegation for coupon removal (works with dynamically added elements)
$('body').on('click', '.remove-coupon', function (e) {
    e.preventDefault();
    
    var $button = $(this);
    var couponCode = $button.data('code');
    var uuid = $button.data('uuid');
    var $deleteConfirmBtn = $('.delete-coupon-confirmation-btn');
    var $productToRemoveSpan = $('.coupon-to-remove');
    
    $deleteConfirmBtn.data('uuid', uuid);
    $deleteConfirmBtn.data('code', couponCode);
    $productToRemoveSpan.empty().append(couponCode);
});

// Performance: Consolidate DOMContentLoaded and optimize scroll handlers
document.addEventListener('DOMContentLoaded', function() {
    // Performance: Use event delegation for guest buttons
    $(document).on('click', '.js-cancel-login', function() {
        // Use requestAnimationFrame for smoother, non-blocking scroll
        requestAnimationFrame(function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Performance: Defer registration form scroll using requestIdleCallback
    function initRegistrationFormScroll() {
        var checkoutRegisterForm = document.querySelector('form.registration');
        if (checkoutRegisterForm) {
            // Use requestAnimationFrame for smoother scrolling
            requestAnimationFrame(function() {
                checkoutRegisterForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }

    // Defer non-critical scroll initialization
    if (window.requestIdleCallback) {
        requestIdleCallback(initRegistrationFormScroll, { timeout: 300 });
    } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(initRegistrationFormScroll, 100);
    }
});

module.exports = integrations;
