'use strict';

var integrations = require('integrations/checkout');
integrations.baseFiles.checkout = require('./checkout/checkout');
integrations.baseFiles.smartyAutocomplete = require('./components/smarty');

function syncBillingSelectorForPaymentMethod(methodID) {
    var normalizedMethod = (methodID || '').toString().toLowerCase();
    var isPayPalFamily = normalizedMethod.indexOf('paypal') > -1
        || normalizedMethod.indexOf('venmo') > -1
        || normalizedMethod.indexOf('paylater') > -1
        || normalizedMethod.indexOf('applepay') > -1
        || normalizedMethod.indexOf('googlepay') > -1;
    var isPayPalOnly = normalizedMethod.indexOf('paypal') > -1
        && normalizedMethod.indexOf('venmo') === -1
        && normalizedMethod.indexOf('paylater') === -1
        && normalizedMethod.indexOf('applepay') === -1
        && normalizedMethod.indexOf('googlepay') === -1;

    var $billingAddressSelector = $('.payment-form .addressSelector, #billingAddressSelector');
    var $billingActionButtons = $('.address-selector-block .btn-add-new, .address-selector-block .btn-show-details');
    var $billingAddressForm = $('.billing-address-block .billing-address');
    var $billingPhoneField = $('.dwfrm_billing_contactInfoFields_phone');
    var $submitPayment = $('.submit-payment');

    function syncBillingAddressMessage() {
        var billingAddressMsg = $billingAddressSelector.attr('data-billing-address-msg');
        var $selectedOption = $billingAddressSelector.find('option:selected');

        billingAddressMsg = (billingAddressMsg || '').trim();
        if (billingAddressMsg.toLowerCase() === 'undefined' || billingAddressMsg.toLowerCase() === 'null') {
            billingAddressMsg = '';
        }

        if (!billingAddressMsg || !$selectedOption.length) {
            return;
        }

        var originalText = $selectedOption.attr('data-original-label');
        var currentText = $.trim($selectedOption.text());

        if (!originalText && currentText && currentText !== billingAddressMsg) {
            $selectedOption.attr('data-original-label', currentText);
            originalText = currentText;
        }

        if (isPayPalOnly) {
            $selectedOption.text(billingAddressMsg);
            return;
        }

        if (currentText === billingAddressMsg && originalText) {
            $selectedOption.text(originalText);
        }
    }

    if (isPayPalFamily) {
        $billingAddressSelector.attr('disabled', 'disabled');
        // PayPal Smart Buttons own the CTA — hide SFRA Review Order on PayPal tab.
        if (isPayPalOnly) {
            $submitPayment.addClass('d-none').attr('hidden', 'hidden').each(function () {
                this.style.display = 'none';
            });
        }
    } else {
        // Re-enable complete billing address behavior for non-PayPal methods.
        $billingAddressSelector.removeAttr('disabled');
        $billingActionButtons.removeClass('none');
        $billingAddressForm.removeClass('none');
        $billingPhoneField.removeClass('none');
        $submitPayment.removeClass('none d-none').removeAttr('hidden').each(function () {
            if (this.style && this.style.display === 'none') {
                this.style.display = '';
            }
        });

        // Keep address form usable when customer switches back from PayPal-managed tabs.
        var selectedAddressValue = $billingAddressSelector.find('option:selected').val();
        var isNewAddress = selectedAddressValue === 'new' || selectedAddressValue === 'manual-entry';
        if (isNewAddress) {
            $billingAddressForm.removeClass('none');
        }
    }

    // Run after third-party tab handlers so custom rules win without changing integration code.
    requestAnimationFrame(syncBillingAddressMessage);
}

function getActiveCheckoutPaymentMethod() {
    var $activeLink = $('.payment-options .nav-link.active').first();
    if ($activeLink.length) {
        return $activeLink.data('method-id') || $activeLink.closest('.nav-item').data('method-id');
    }

    var $activeItem = $('.payment-options .nav-item.active').first();
    if ($activeItem.length) {
        return $activeItem.data('method-id');
    }

    return $('.payment-information').data('payment-method-id')
        || $('input[name$="_paymentMethod"]:checked').val();
}

function normalizeMethodID(methodID) {
    return (methodID || '').toString().trim().toLowerCase();
}

function findPaymentNavLinkByMethodID(methodID) {
    var normalizedTarget = normalizeMethodID(methodID);

    if (!normalizedTarget) {
        return $();
    }

    var $links = $('.payment-options .nav-link').filter(function () {
        var href = $(this).attr('href') || '';
        return href && href.charAt(0) === '#';
    });

    var $exact = $links.filter(function () {
        var $link = $(this);
        var linkMethodID = $link.data('method-id') || $link.closest('.nav-item').data('method-id');
        return normalizeMethodID(linkMethodID) === normalizedTarget;
    }).first();

    if ($exact.length) {
        return $exact;
    }

    if (normalizedTarget.indexOf('paypal') > -1 || normalizedTarget.indexOf('venmo') > -1 || normalizedTarget.indexOf('paylater') > -1) {
        return $links.filter(function () {
            var $link = $(this);
            var linkMethodID = normalizeMethodID($link.data('method-id') || $link.closest('.nav-item').data('method-id'));
            return linkMethodID.indexOf('paypal') > -1 || linkMethodID.indexOf('venmo') > -1 || linkMethodID.indexOf('paylater') > -1;
        }).first();
    }

    return $();
}

function enforceSingleActivePaymentTab(methodID, $preferredLink) {
    var $targetLink = ($preferredLink && $preferredLink.length) ? $preferredLink.first() : $();

    if (!$targetLink.length) {
        $targetLink = findPaymentNavLinkByMethodID(methodID);
    }

    if (!$targetLink.length) {
        return;
    }

    var targetPaneSelector = $targetLink.attr('href') || '';
    var $targetPane = targetPaneSelector && targetPaneSelector.charAt(0) === '#'
        ? $(targetPaneSelector)
        : $();

    $('.payment-options .nav-link').removeClass('active').attr('aria-selected', 'false');
    $('.payment-options .nav-item').removeClass('active');
    $('.payment-form .tab-pane').removeClass('active show');

    $targetLink.addClass('active').attr('aria-selected', 'true');
    $targetLink.closest('.nav-item').addClass('active');

    if ($targetPane.length) {
        $targetPane.addClass('active show');
    }
}

function syncPaymentMethodForSubmission(sourceMethodID) {
    var methodID = sourceMethodID || getActiveCheckoutPaymentMethod();

    if (!methodID) {
        return;
    }

    $('.payment-information').data('payment-method-id', methodID);

    var $matchingMethodInput = $('input[name$="_paymentMethod"][value="' + methodID + '"]');
    if ($matchingMethodInput.length) {
        $matchingMethodInput.prop('checked', true);
    }

    var normalizedMethod = (methodID || '').toString().toLowerCase();
    var isPayPalFamily = normalizedMethod.indexOf('paypal') > -1
        || normalizedMethod.indexOf('venmo') > -1
        || normalizedMethod.indexOf('paylater') > -1
        || normalizedMethod.indexOf('applepay') > -1
        || normalizedMethod.indexOf('googlepay') > -1;

    if (!isPayPalFamily) {
        var $paypalUsedMethod = $('input[name="dwfrm_billing_paypal_usedPaymentMethod"]');
        var $paypalActiveAccount = $('input[name="dwfrm_billing_paypal_paypalActiveAccount"]');
        var $paypalAccountsList = $('#restPaypalAccountsList');

        if ($paypalUsedMethod.length) {
            $paypalUsedMethod.val('');
        }

        if ($paypalActiveAccount.length) {
            $paypalActiveAccount.val('');
        }

        if ($paypalAccountsList.length) {
            $paypalAccountsList.val('newaccount');
        }
    }

    enforceSingleActivePaymentTab(methodID);
}

function ensureSubmitPaymentVisible() {
    var $submitButtons = $('button.submit-payment, .next-step-button .submit-payment');

    if (!$submitButtons.length) {
        return;
    }

    var activeMethod = (getActiveCheckoutPaymentMethod() || '').toString().toLowerCase();
    if (activeMethod === 'paypal') {
        $submitButtons.addClass('d-none').attr('hidden', 'hidden').each(function () {
            this.style.display = 'none';
        });
        return;
    }

    $submitButtons.each(function () {
        var $button = $(this);
        var $container = $button.closest('.next-step-button');

        $button.removeClass('none d-none disabled').prop('disabled', false).removeAttr('hidden');
        if ($button[0] && $button[0].style && $button[0].style.display === 'none') {
            $button[0].style.display = '';
        }

        if ($container.length) {
            $container.removeClass('none d-none disabled').removeAttr('hidden');
            if ($container[0] && $container[0].style && $container[0].style.display === 'none') {
                $container[0].style.display = '';
            }
        }
    });
}

function getFirstVisiblePaymentNavLink() {
    return $('.payment-options .nav-link').filter(function () {
        var $link = $(this);
        var href = $link.attr('href') || '';

        if (!href || href.charAt(0) !== '#') {
            return false;
        }

        if (!$link.closest('.nav-item').is(':visible')) {
            return false;
        }

        return $(href).length > 0;
    }).first();
}

function getPreferredPaymentNavLink() {
    var $stripePaymentElementLink = $('.payment-options .payment-method-item[data-method-id="STRIPE_PAYMENT_ELEMENT"] .nav-link').filter(function () {
        var $link = $(this);
        var href = $link.attr('href') || '';

        if (!href || href.charAt(0) !== '#') {
            return false;
        }

        if (!$link.closest('.nav-item').is(':visible')) {
            return false;
        }

        return $(href).length > 0;
    }).first();

    if ($stripePaymentElementLink.length) {
        return $stripePaymentElementLink;
    }

    return getFirstVisiblePaymentNavLink();
}

function normalizeCheckoutPaymentDefaultSelection() {
    // Clear stale tab memory that can be left after login/payment-method switching.
    if (window.sessionStorage) {
        window.sessionStorage.removeItem('activeNavLink');
        window.sessionStorage.removeItem('active-tab');
    }

    var $firstVisibleLink = getPreferredPaymentNavLink();

    if (!$firstVisibleLink.length) {
        return;
    }

    var targetPaneSelector = $firstVisibleLink.attr('href');
    var $targetPane = $(targetPaneSelector);
    var methodID = $firstVisibleLink.data('method-id') || $firstVisibleLink.closest('.nav-item').data('method-id');

    $('.payment-options .nav-link').removeClass('active').attr('aria-selected', 'false');
    $('.payment-options .nav-item').removeClass('active');
    $('.payment-form .tab-pane').removeClass('active show');

    $firstVisibleLink.addClass('active').attr('aria-selected', 'true');
    $firstVisibleLink.closest('.nav-item').addClass('active');

    if ($targetPane.length) {
        $targetPane.addClass('active show');
    }

    syncPaymentMethodForSubmission(methodID);
    syncBillingSelectorForPaymentMethod(methodID);
}

function enforceStripeDefaultOnPaymentStageEntry() {
    var stageHost = document.querySelector('.data-checkout-stage') || document.getElementById('checkout-main');

    if (!stageHost) {
        return;
    }

    var wasPaymentStage = stageHost.getAttribute('data-checkout-stage') === 'payment';

    if (wasPaymentStage) {
        return;
    }

    var hasForcedStripeDefault = false;
    var observer = new MutationObserver(function () {
        var isPaymentStage = stageHost.getAttribute('data-checkout-stage') === 'payment';

        if (!isPaymentStage || hasForcedStripeDefault) {
            return;
        }

        hasForcedStripeDefault = true;
        normalizeCheckoutPaymentDefaultSelection();
    });

    observer.observe(stageHost, { attributes: true, attributeFilter: ['data-checkout-stage'] });
}

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

    // Keep billing address enabled for non-PayPal methods and disabled only for PayPal-family tabs.
    normalizeCheckoutPaymentDefaultSelection();
    enforceStripeDefaultOnPaymentStageEntry();

    var initialMethod = getActiveCheckoutPaymentMethod();
    syncPaymentMethodForSubmission(initialMethod);
    syncBillingSelectorForPaymentMethod(initialMethod);

    $(document).on('click', '.payment-options .nav-item, .payment-options .nav-link', function () {
        var $clickedLink = $(this).hasClass('nav-link') ? $(this) : $(this).find('.nav-link').first();
        var methodID = $(this).data('method-id') || $(this).closest('.nav-item').data('method-id') || $clickedLink.data('method-id') || getActiveCheckoutPaymentMethod();
        enforceSingleActivePaymentTab(methodID, $clickedLink);
        syncPaymentMethodForSubmission(methodID);
        syncBillingSelectorForPaymentMethod(methodID);
    });

    $(document).on('shown.bs.tab', '.payment-options .nav-link', function (e) {
        var $shownLink = $(e.target);
        var methodID = $shownLink.data('method-id') || $shownLink.closest('.nav-item').data('method-id') || getActiveCheckoutPaymentMethod();
        enforceSingleActivePaymentTab(methodID, $shownLink);
        syncPaymentMethodForSubmission(methodID);
        syncBillingSelectorForPaymentMethod(methodID);
    });

    // Final guard: prevent stale saved-payment submission after rapid tab switching.
    $(document).on('click', '.submit-payment, .next-step-button .submit-payment', function () {
        syncPaymentMethodForSubmission(getActiveCheckoutPaymentMethod());
    });

    $(document).on('submit', '#dwfrm_billing', function () {
        syncPaymentMethodForSubmission(getActiveCheckoutPaymentMethod());
    });

    $('body').on('checkout:updateCheckoutView checkout:updateCheckoutViewPaymentInformation', function () {
        var methodID = getActiveCheckoutPaymentMethod();

        enforceSingleActivePaymentTab(methodID);
        syncPaymentMethodForSubmission(methodID);
        syncBillingSelectorForPaymentMethod(methodID);
        ensureSubmitPaymentVisible();

        // Repeat once after external listeners complete to avoid hide/show races.
        window.setTimeout(function () {
            var refreshedMethodID = getActiveCheckoutPaymentMethod();
            enforceSingleActivePaymentTab(refreshedMethodID);
            syncPaymentMethodForSubmission(refreshedMethodID);
            syncBillingSelectorForPaymentMethod(refreshedMethodID);
            ensureSubmitPaymentVisible();
        }, 0);
    });
});

module.exports = integrations;
