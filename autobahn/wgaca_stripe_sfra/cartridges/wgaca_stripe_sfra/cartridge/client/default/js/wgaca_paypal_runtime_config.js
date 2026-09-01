'use strict';

(function () {
    function readJsonFromInput(id) {
        var el = document.getElementById(id);

        if (!el || !el.value) {
            return {};
        }

        try {
            return JSON.parse(el.value);
        } catch (e) {
            return {};
        }
    }

    window.paypalUrls = readJsonFromInput('wgacaPayPalUrls');
    window.paypalConstants = readJsonFromInput('wgacaPayPalConstants');
    window.paypalPreferences = readJsonFromInput('wgacaPayPalPreferences');
}());

/**
 * Checkout payment-tab bridge (moved from paypalContent.isml).
 * Keeps Stripe Review Order visible, syncs active tab/method, and debugs PayPal StreamlinedCheckout.
 */
(function () {
    if (window.__wgacaPaypalCheckoutBridgeInstalled) {
        return;
    }

    window.__wgacaPaypalCheckoutBridgeInstalled = true;

    function setSelectedPaymentMethod(methodId) {
        var form = document.querySelector('form[name="dwfrm_billing"]');
        var selectedInput = form && form.querySelector('#selectedPaymentOption');
        var paymentInfo = document.querySelector('.js-payment-information');
        var submitPaymentBtn = document.querySelector('button.submit-payment');

        if (!methodId || !form) {
            return;
        }

        if (selectedInput) {
            selectedInput.value = methodId;
        }

        if (paymentInfo) {
            paymentInfo.setAttribute('data-payment-method-id', methodId);
        }

        if (submitPaymentBtn && (methodId === 'STRIPE_PAYMENT_ELEMENT' || methodId === 'BANK_TRANSFER' || methodId === 'CREDIT_CARD')) {
            submitPaymentBtn.style.display = '';
            submitPaymentBtn.classList.remove('none');
            submitPaymentBtn.classList.remove('d-none');
            submitPaymentBtn.removeAttribute('hidden');
            submitPaymentBtn.disabled = false;
            submitPaymentBtn.removeAttribute('disabled');
            submitPaymentBtn.classList.remove('disabled');
        }
    }

    function forceReviewOrderForStripeIfActive() {
        var activeTab = document.querySelector('.payment-options .nav-link.active');
        var activeNavItem = activeTab && activeTab.closest('.payment-method-item');
        var activeMethodId = activeNavItem ? activeNavItem.getAttribute('data-method-id') : null;
        var submitPaymentBtn = document.querySelector('button.submit-payment');

        if (!submitPaymentBtn) {
            return;
        }

        if (activeMethodId === 'STRIPE_PAYMENT_ELEMENT' || activeMethodId === 'BANK_TRANSFER' || activeMethodId === 'CREDIT_CARD') {
            setSelectedPaymentMethod(activeMethodId);
            submitPaymentBtn.style.display = '';
            submitPaymentBtn.classList.remove('none');
            submitPaymentBtn.classList.remove('d-none');
            submitPaymentBtn.removeAttribute('hidden');
            submitPaymentBtn.disabled = false;
            submitPaymentBtn.removeAttribute('disabled');
            submitPaymentBtn.classList.remove('disabled');
        }
    }

    function syncActivePaymentPaneWithTab() {
        var activeTab = document.querySelector('.payment-options .nav-link.active');
        var targetSelector = activeTab ? activeTab.getAttribute('href') : null;
        var targetPane;
        var paneNodes;

        if (!targetSelector || targetSelector.charAt(0) !== '#') {
            return;
        }

        targetPane = document.querySelector(targetSelector);

        if (!targetPane) {
            return;
        }

        paneNodes = document.querySelectorAll('.credit-card-selection-new .tab-content .tab-pane, .tab-content .tab-pane');
        Array.prototype.forEach.call(paneNodes, function (pane) {
            if (pane !== targetPane) {
                pane.classList.remove('active');
                pane.classList.remove('show');
            }
        });

        targetPane.classList.add('active');
        targetPane.classList.add('show');
    }

    function getCurrentMethodId() {
        var activeTab = document.querySelector('.payment-options .nav-link.active');
        var activeNavItem = activeTab && activeTab.closest('.payment-method-item');

        if (activeNavItem) {
            return activeNavItem.getAttribute('data-method-id');
        }

        return null;
    }

    function normalizeSelectionFromStoredMethod() {
        var form = document.querySelector('form[name="dwfrm_billing"]');
        var selectedInput = form && form.querySelector('#selectedPaymentOption');
        var methodId = selectedInput && selectedInput.value;
        var tabLink;

        if (!methodId) {
            return null;
        }

        tabLink = document.querySelector('.payment-options .payment-method-item[data-method-id="' + methodId + '"] .nav-link');
        if (tabLink) {
            var navLinks = document.querySelectorAll('.payment-options .nav-link');
            Array.prototype.forEach.call(navLinks, function (link) {
                if (link !== tabLink) {
                    link.classList.remove('active');
                }
            });
            tabLink.classList.add('active');
            syncActivePaymentPaneWithTab();
            return methodId;
        }

        return null;
    }

    function getFirstNonEmptyValue(selectors) {
        var i;
        var node;
        var value;

        for (i = 0; i < selectors.length; i++) {
            node = document.querySelector(selectors[i]);
            value = node && typeof node.value === 'string' ? node.value.trim() : '';
            if (value) {
                return value;
            }
        }

        return '';
    }

    function ensureBillingPhoneBeforeSubmit() {
        var form = document.querySelector('form[name="dwfrm_billing"]');
        var phoneInputs;
        var hasAnyPhoneValue = false;
        var fallbackPhone;

        if (!form) {
            return;
        }

        phoneInputs = form.querySelectorAll('input[name$="_phone"]');
        Array.prototype.forEach.call(phoneInputs, function (input) {
            if (input && typeof input.value === 'string' && input.value.trim()) {
                hasAnyPhoneValue = true;
            }
        });

        if (hasAnyPhoneValue) {
            return;
        }

        fallbackPhone = getFirstNonEmptyValue([
            '.single-shipping input[name$="_phone"]',
            '.multi-shipping input[name$="_phone"]',
            '#dwfrm_shipping input[name$="_phone"]',
            '.order-summary-phone'
        ]);

        if (!fallbackPhone) {
            return;
        }

        Array.prototype.forEach.call(phoneInputs, function (input) {
            input.value = fallbackPhone;
        });
    }

    function ensureSavedStripeCardSubmitPayload(methodId) {
        var savedCard;
        var sourceInputs;
        var paymentInfo;

        if (methodId !== 'CREDIT_CARD') {
            return;
        }

        savedCard = document.querySelector('input[name="saved_card_id"]:checked');
        if (!savedCard || !savedCard.value) {
            return;
        }

        sourceInputs = document.querySelectorAll('input[name="stripe_source_id"]');
        Array.prototype.forEach.call(sourceInputs, function (input) {
            input.value = savedCard.value;
        });

        paymentInfo = document.querySelector('.payment-information');
        if (paymentInfo) {
            paymentInfo.setAttribute('data-is-new-payment', 'true');
            // SFRA/members read jQuery .data() which caches the initial HTML value;
            // setAttribute alone does not update that cache.
            if (window.jQuery) {
                window.jQuery(paymentInfo).data('is-new-payment', true);
            }
        }
    }

    function sanitizeInvalidPatternAttributes() {
        var invalidPhonePattern = '^[\\d+() -]+$';
        var safePhonePattern = '^[0-9+()\\- ]+$';
        var fields = document.querySelectorAll('input[pattern], textarea[pattern]');

        Array.prototype.forEach.call(fields, function (field) {
            var pattern = field.getAttribute('pattern');

            if (pattern === invalidPhonePattern) {
                field.setAttribute('pattern', safePhonePattern);
            }
        });
    }

    function ensurePaymentSelectionBeforeSubmit() {
        var methodId = getCurrentMethodId() || normalizeSelectionFromStoredMethod();

        sanitizeInvalidPatternAttributes();

        if (methodId) {
            setSelectedPaymentMethod(methodId);
            ensureSavedStripeCardSubmitPayload(methodId);
        }

        ensureBillingPhoneBeforeSubmit();
        syncActivePaymentPaneWithTab();
        forceReviewOrderForStripeIfActive();
    }

    function ensurePayPalPaymentMethodSelection() {
        var content = document.querySelector('.js-paypal-content');
        var form = document.querySelector('form[name="dwfrm_billing"]');

        if (!content || !form) {
            return;
        }

        var usedMethodInput = form.querySelector('input[name="dwfrm_billing_paypal_usedPaymentMethod"]');

        setSelectedPaymentMethod('PayPal');

        if (usedMethodInput && !usedMethodInput.value) {
            usedMethodInput.value = 'PayPal';
        }
    }

    function ensurePayPalTabNodes() {
        var tabList = document.querySelector('.payment-options[role="tablist"]');

        if (!tabList) {
            return;
        }

        var paypalNavItem = document.querySelector('.js-nav-item-paypal');

        if (!paypalNavItem) {
            paypalNavItem = document.createElement('li');
            paypalNavItem.className = 'nav-item js-nav-item-paypal d-none paypal-dom-fallback';
            paypalNavItem.setAttribute('data-method-id', 'PayPal');

            var paypalTab = document.createElement('a');
            paypalTab.className = 'nav-link js-paypal-tab';
            paypalTab.setAttribute('data-toggle', 'tab');
            paypalTab.setAttribute('href', '#paypal-content');
            paypalTab.setAttribute('role', 'tab');

            var paypalMark = document.createElement('div');
            paypalMark.className = 'js-paypal-mark';

            paypalTab.appendChild(paypalMark);
            paypalNavItem.appendChild(paypalTab);
            tabList.appendChild(paypalNavItem);
        } else if (!paypalNavItem.querySelector('.js-paypal-mark')) {
            var existingTab = paypalNavItem.querySelector('.js-paypal-tab') || paypalNavItem;
            var missingMark = document.createElement('div');

            missingMark.className = 'js-paypal-mark';
            existingTab.appendChild(missingMark);
        }

        var venmoNavItem = document.querySelector('.js-nav-item-venmo');

        if (venmoNavItem && !venmoNavItem.querySelector('.js-venmo-mark')) {
            var venmoTab = venmoNavItem.querySelector('.js-venmo-tab') || venmoNavItem;
            var venmoMark = document.createElement('div');

            venmoMark.className = 'js-venmo-mark';
            venmoTab.appendChild(venmoMark);
        }
    }

    function installStreamlinedCheckoutDebug() {
        if (!window.fetch || window.__paypal422DebugInstalled) {
            return;
        }

        window.__paypal422DebugInstalled = true;

        var originalFetch = window.fetch.bind(window);

        function isStreamlinedCheckoutUrl(url) {
            if (!url) {
                return false;
            }

            var urlValue = typeof url === 'string' ? url : (url.url || '');

            return urlValue.indexOf('Paypal-StreamlinedCheckout') !== -1;
        }

        function toObjectFromFormData(formData) {
            var payload = {};

            if (!formData || typeof formData.forEach !== 'function') {
                return payload;
            }

            formData.forEach(function (value, key) {
                payload[key] = value;
            });

            return payload;
        }

        function readQueryParam(urlValue, key) {
            try {
                var absoluteUrl = new URL(urlValue, window.location.origin);

                return absoluteUrl.searchParams.get(key);
            } catch (e) {
                return null;
            }
        }

        function ensureStreamlinedCheckoutFormData(body) {
            var formData = body instanceof FormData ? body : new FormData();
            var form = document.querySelector('form[name="dwfrm_billing"]');
            var usedMethodInput = form && form.querySelector('input[name="dwfrm_billing_paypal_usedPaymentMethod"]');
            var paymentMethodInput = form && form.querySelector('input[name="dwfrm_billing_paymentMethod"]');
            var selectedOptionInput = form && form.querySelector('#selectedPaymentOption');

            var usedMethod = (usedMethodInput && usedMethodInput.value)
                || (selectedOptionInput && selectedOptionInput.value === 'PayPal' ? 'PayPal' : '')
                || 'PayPal';
            var paymentMethod = (paymentMethodInput && paymentMethodInput.value)
                || (selectedOptionInput && selectedOptionInput.value)
                || 'PayPal';

            if (!formData.get('dwfrm_billing_paypal_usedPaymentMethod')) {
                formData.set('dwfrm_billing_paypal_usedPaymentMethod', usedMethod);
            }

            if (!formData.get('dwfrm_billing_paymentMethod')) {
                formData.set('dwfrm_billing_paymentMethod', paymentMethod);
            }

            return formData;
        }

        window.fetch = function (input, init) {
            var requestUrl = typeof input === 'string' ? input : (input && input.url ? input.url : '');
            var requestInit = init || {};
            var body = requestInit.body;
            var isTarget = isStreamlinedCheckoutUrl(requestUrl);

            if (!isTarget) {
                return originalFetch(input, init);
            }

            requestInit.body = ensureStreamlinedCheckoutFormData(body);

            var actualPayload = toObjectFromFormData(requestInit.body);
            var expectedKeys = ['dwfrm_billing_paypal_usedPaymentMethod', 'dwfrm_billing_paymentMethod'];
            var missingKeys = expectedKeys.filter(function (key) {
                return !(key in actualPayload) || actualPayload[key] === '' || actualPayload[key] === null;
            });

            var csrfToken = readQueryParam(requestUrl, 'csrf_token');
            var payerEmailNode = document.querySelector('.js-paypal-button-on-billing-form');
            var payerEmail = payerEmailNode ? payerEmailNode.getAttribute('data-customer-email') : '';

            return originalFetch(input, requestInit).then(function (response) {
                if (!response.ok) {
                    return response.clone().text().then(function (bodyText) {
                        var parsed;
                        var contentType = response.headers && response.headers.get
                            ? response.headers.get('content-type') : '';

                        try {
                            parsed = JSON.parse(bodyText);
                        } catch (e) {
                            parsed = {
                                message: bodyText || '(empty body)',
                                parseError: e && e.message ? e.message : 'Unable to parse response as JSON',
                                contentType: contentType || '(unknown)'
                            };
                        }

                        console.group('[PayPal 422 Debug] StreamlinedCheckout response error');
                        console.log('status', response.status);
                        console.log('statusText', response.statusText);
                        console.log('url', response.url || requestUrl);
                        console.log('method', requestInit.method || 'GET');
                        console.log('expectedKeys', expectedKeys);
                        console.log('actualPayload', actualPayload);
                        console.log('missingOrEmptyKeys', missingKeys);
                        console.log('csrf_token_present', Boolean(csrfToken));
                        console.log('customerEmail(data-customer-email)', payerEmail || '(empty)');
                        console.log('responseContentType', contentType || '(unknown)');
                        console.log('rawBody', bodyText);
                        console.log('parsedBody', parsed);
                        if (response.status === 422 && parsed && parsed.serverErrors) {
                            console.log('serverErrors', parsed.serverErrors);
                            console.log('fieldErrors', parsed.fieldErrors);
                        }
                        console.groupEnd();

                        return response;
                    });
                }

                return response;
            }).catch(function (error) {
                console.group('[PayPal 422 Debug] StreamlinedCheckout network/runtime error');
                console.error(error);
                console.groupEnd();
                throw error;
            });
        };

        console.info('[PayPal 422 Debug] Enabled for StreamlinedCheckout non-2xx responses.');
    }

    function initWgacaPaypalCheckoutBridge() {
        ensurePayPalTabNodes();

        // PayPal initPaymentStageBehavior fires this on Edit Payment → payment.
        // Re-show Review Order for Stripe after PayPal tab handlers finish.
        document.addEventListener('payment-stage:update', function () {
            window.setTimeout(function () {
                syncActivePaymentPaneWithTab();
                forceReviewOrderForStripeIfActive();
            }, 0);
        });

        document.addEventListener('shown.bs.tab', function (event) {
            var tabLink = event && event.target ? event.target : null;
            var navItem = tabLink && tabLink.closest('.payment-method-item');
            var methodId = navItem ? navItem.getAttribute('data-method-id') : null;

            if (methodId) {
                setSelectedPaymentMethod(methodId);
            }

            // Let base listeners (including PayPal's tab handler) run first, then enforce Stripe behavior.
            window.setTimeout(function () {
                syncActivePaymentPaneWithTab();
                forceReviewOrderForStripeIfActive();
            }, 0);
        }, true);

        document.addEventListener('click', function (event) {
            var target = event.target;

            if (target && (target.closest('.js-paypal-tab') || target.closest('.js-paypal-button-on-billing-form'))) {
                ensurePayPalPaymentMethodSelection();
            }
        }, true);

        document.addEventListener('change', function (event) {
            var target = event && event.target ? event.target : null;

            if (target && target.id === 'restPaypalAccountsList') {
                setSelectedPaymentMethod('PayPal');
            }
        }, true);

        document.addEventListener('click', function (event) {
            var tabLink = event && event.target ? event.target.closest('.payment-options .nav-link') : null;

            if (tabLink) {
                var navLinks = document.querySelectorAll('.payment-options .nav-link');
                Array.prototype.forEach.call(navLinks, function (link) {
                    if (link !== tabLink) {
                        link.classList.remove('active');
                    }
                });

                tabLink.classList.add('active');

                window.setTimeout(function () {
                    syncActivePaymentPaneWithTab();
                    forceReviewOrderForStripeIfActive();
                }, 0);
            }
        }, true);

        window.setTimeout(function () {
            syncActivePaymentPaneWithTab();
            forceReviewOrderForStripeIfActive();
        }, 0);

        document.addEventListener('click', function (event) {
            var submitBtn = event && event.target ? event.target.closest('button.submit-payment') : null;

            if (submitBtn) {
                ensurePaymentSelectionBeforeSubmit();
            }
        }, true);

        installStreamlinedCheckoutDebug();
    }

    // Compiled assets often load after DOM parse; wait if needed so tab nodes exist.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWgacaPaypalCheckoutBridge);
    } else {
        initWgacaPaypalCheckoutBridge();
    }
}());
