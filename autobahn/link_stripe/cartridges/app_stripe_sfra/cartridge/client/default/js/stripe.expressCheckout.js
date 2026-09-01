'use strict';

var baseDetail = require('base/product/detail');
var stripeOptions = {
    paymentMethods: {
        applePay: 'always',
        googlePay: 'never',
        link: 'never',
        klarna: 'never',
        amazonPay: 'never',
        paypal: 'never'
    },
    paymentMethodOrder: ['apple_pay'],
    buttonTheme: {
        applePay: 'black'
    }
};
var expressCheckoutElement;
var stripe;
var elements;
var cachedShippingOptions = null;
var MAX_SHIPPING_RATES = 9;
var isExpressCheckoutInitialized = false;

function normalizeShippingRates(rates) {
    if (!Array.isArray(rates) || !rates.length) {
        return [];
    }

    return rates
        .filter(function (rate) {
            return rate && rate.id && rate.displayName;
        })
        .slice(0, MAX_SHIPPING_RATES)
        .map(function (rate) {
            return {
                id: String(rate.id),
                displayName: String(rate.displayName),
                amount: toMinorUnits(rate.amount),
                detail: rate.detail ? String(rate.detail) : ''
            };
        })
        .filter(function (rate) {
            return Number.isFinite(rate.amount) && rate.amount >= 0;
        });
}

function isProductPageExpress() {
    return $('#express-checkout-element').hasClass('isProductPage');
}

function isCheckoutButtonEnabled() {
    var checkoutButton = $('.checkout-btn').first();
    if (!checkoutButton.length) {
        return true;
    }

    return !checkoutButton.hasClass('disabled')
        && checkoutButton.attr('aria-disabled') !== 'true'
        && checkoutButton.attr('disabled') !== 'disabled';
}

function syncExpressVisibilityWithCheckoutButton() {
    var expressElement = $('#express-checkout-element');
    if (!expressElement.length || isProductPageExpress()) {
        return;
    }

    if (isCheckoutButtonEnabled()) {
        expressElement.removeClass('d-none');
    } else {
        expressElement.addClass('d-none');
    }
}

function observeCheckoutButtonState() {
    if (isProductPageExpress()) {
        return;
    }

    var checkoutButton = document.querySelector('.checkout-btn');
    if (!checkoutButton || typeof MutationObserver === 'undefined') {
        return;
    }

    var observer = new MutationObserver(syncExpressVisibilityWithCheckoutButton);
    observer.observe(checkoutButton, {
        attributes: true,
        attributeFilter: ['class', 'disabled', 'aria-disabled']
    });
}

function getShippingOptionsRequestData(extraData) {
    var bodyData = getProductData(extraData || {});

    if (!isProductPageExpress()) {
        bodyData.cart = true;
    }

    return bodyData;
}

function setCachedShippingOptions(data) {
    if (!data) {
        return;
    }

    cachedShippingOptions = data;
    updateElementsAmount(data.cartTotal, 'payment');
}

function prefetchShippingOptions() {
    $.ajax({
        url: $('#stripe_get_shipping_options').val(),
        method: 'GET',
        data: getShippingOptionsRequestData(),
        success: function (data) {
            setCachedShippingOptions(data);
        }
    });
}

function toMinorUnits(value) {
    if (value === null || value === undefined) {
        return null;
    }

    var isString = typeof value === 'string';
    var parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return null;
    }

    // If backend returns major units as decimal string (e.g. "39.95"), convert to minor units.
    if (isString && value.indexOf('.') !== -1) {
        parsed = Math.round(parsed * 100);
    } else {
        parsed = Math.round(parsed);
    }

    return parsed > 0 ? parsed : null;
}

function updateElementsAmount(amount, mode) {
    var safeAmount = toMinorUnits(amount);

    if (!safeAmount || !elements) {
        return false;
    }

    var updatePayload = { amount: safeAmount };
    if (mode) {
        updatePayload.mode = mode;
    }

    elements.update(updatePayload);
    return true;
}

function setupStripeContext() {
    var stripeElement = document.getElementById('express-checkout-element');
    if (!stripeElement) {
        return false;
    }

    if (typeof Stripe !== 'function') {
        return false;
    }

    var stripeApiVersionElement = document.getElementById('stripeApiVersion');
    var stripePublicKeyElement = document.getElementById('stripePublicKey');
    var stripeOrderCurrencyElement = document.getElementById('stripe_order_currency');
    var stripeAppearanceElement = document.getElementById('stripeExpressCheckoutAppearance');

    if (!stripeApiVersionElement || !stripePublicKeyElement || !stripeOrderCurrencyElement || !stripeAppearanceElement) {
        return false;
    }

    stripe = Stripe(stripePublicKeyElement.value, stripeApiVersionElement.value);
    elements = stripe.elements({
        mode: 'setup',
        currency: stripeOrderCurrencyElement.value.toLowerCase(),
        appearance: JSON.parse(stripeAppearanceElement.value),
        capture_method: $('#stripeCaptureMethod').val()
    });

    return true;
}

/**
 * Estimtes The amount to be displayed when initialising the ECE
 * @param {Object} product - Product Data
 * @param {string} shippingCost - Shipping cost
 * @returns {number} The initial estimated basket value
 */
function getAmountToDisplay(product, shippingCost) {
    if ($('#express-checkout-element').hasClass('isProductPage')) {
        var shippingAmount = Number(shippingCost || 0);
        var quantitySelected = parseInt($('button.add-to-cart').closest('.product-detail').find('.quantity-select').val(), 10);
        quantitySelected = Number.isFinite(quantitySelected) && quantitySelected > 0 ? quantitySelected : 1;

        var productPrice = !product ? Number(document.getElementById('stripeProductPrice').value) : Number(product.price.sales.value);
        if (!Number.isFinite(productPrice) || productPrice <= 0) {
            return 0;
        }

        var productTotalPrice = Math.round(productPrice * 100);

        return productTotalPrice * quantitySelected + shippingAmount;
    }

    var basketValue = document.getElementById('stripe_order_amount').value;

    return basketValue;
}

/**
 * Mounts ECE Element
 */
function mountExpressCheckoutButton() {
    if (!elements) {
        return;
    }

    expressCheckoutElement = elements.create('expressCheckout', stripeOptions);
    expressCheckoutElement.mount('#express-checkout-element');
}

/**
 * Retrieve product options
 *
 * @param {jQuery} $productContainer - DOM element for current product
 * @return {string} - Product options and their selected values
 */
function getOptions($productContainer) {
    var options = $productContainer
        .find('.product-option')
        .map(function () {
            var $elOption = $(this).find('.options-select');
            var urlValue = $elOption.val();
            var selectedValueId = $elOption.find('option[value="' + urlValue + '"]')
                .data('value-id');
            return {
                optionId: $(this).data('option-id'),
                selectedValueId: selectedValueId
            };
        }).toArray();

    return JSON.stringify(options);
}

/**
 * Retrieves the bundle product item ID's for the Controller to replace bundle master product
 * items with their selected variants
 *
 * @return {string[]} - List of selected bundle product item ID's
 */
function getChildProducts() {
    var childProducts = [];
    $('.bundle-item').each(function () {
        childProducts.push({
            pid: $(this).find('.product-id').text(),
            quantity: parseInt($(this).find('label.quantity').data('quantity'), 10)
        });
    });

    return childProducts.length ? JSON.stringify(childProducts) : [];
}

/**
 * Updates Express Checkout Element Visibility
 * @param {Object} product - Product data
 */
function updateExpressCheckoutElement(product) {
    if (product) {
        if (product.readyToOrder && product.available) {
            $('#express-checkout-element').removeClass('d-none');
        } else {
            $('#express-checkout-element').addClass('d-none');
        }
    }
}

/**
 * Populates an object with add to cart details of the product
 * @param {Object} payload - Payload object to be populater or null
 * @returns {Object} The populated objec
 */
function getProductData(payload) {
    var returnObj = payload || {};

    if ($('.product-detail').length > 0) {
        returnObj.pid = $('button.add-to-cart').closest('.product-detail').find('.product-id').text();
        returnObj.quantity = $('button.add-to-cart').closest('.product-detail').find('.quantity-select').val();
        returnObj.childProducts = getChildProducts();
        var $productContainer = $('button.add-to-cart').closest('.product-detail');
        returnObj.options = getOptions($productContainer);
    }

    return returnObj;
}

/**
 * Initialise Stripe ECE events
 */
function initStripeCheckoutExpress() {
    if (isExpressCheckoutInitialized) {
        return true;
    }

    if (!setupStripeContext()) {
        return false;
    }

    mountExpressCheckoutButton();

    if (!expressCheckoutElement) {
        return false;
    }

    isExpressCheckoutInitialized = true;

    updateElementsAmount(getAmountToDisplay(), 'payment');
    syncExpressVisibilityWithCheckoutButton();
    observeCheckoutButtonState();

    if (!isProductPageExpress()) {
        prefetchShippingOptions();
    }

    expressCheckoutElement.on('click', function (event) {
        var cachedRates = cachedShippingOptions && cachedShippingOptions.shippingMethods
            ? normalizeShippingRates(cachedShippingOptions.shippingMethods)
            : [];

        var resolvePayload = {
            emailRequired: true,
            phoneNumberRequired: true,
            shippingAddressRequired: true,
            shippingRates: cachedRates
        };

        if (cachedShippingOptions && cachedRates.length) {
            updateElementsAmount(cachedShippingOptions.cartTotal, 'payment');
        }

        event.resolve(resolvePayload);

        var bodyData = getShippingOptionsRequestData();

        $.ajax({
            url: $('#stripe_get_shipping_options').val(),
            method: 'GET',
            data: bodyData,
            success: function(data) {
                setCachedShippingOptions(data);
            }
        });
    });

    expressCheckoutElement.on('shippingratechange', function (event) {
        var bodyData = getShippingOptionsRequestData();
        var isSettled = false;
        var fallbackTimeout = setTimeout(function () {
            if (!isSettled) {
                isSettled = true;
                event.resolve();
            }
        }, 800);

        bodyData.selectedShippingRateId = event.shippingRate.id;

        $.ajax({
            url: $('#stripe_get_shipping_options').val(),
            method: 'GET',
            data: bodyData,
            success: function(data) {
                clearTimeout(fallbackTimeout);
                if (isSettled) {
                    return;
                }

                isSettled = true;
                setCachedShippingOptions(data);

                event.resolve();
            },
            error: function() {
                clearTimeout(fallbackTimeout);
                if (!isSettled) {
                    isSettled = true;
                    event.resolve();
                }
            }
        });
    });

    expressCheckoutElement.on('shippingaddresschange', function (event) {
        var bodyData = getShippingOptionsRequestData();
        var isSettled = false;
        var fallbackTimeout = setTimeout(function () {
            if (!isSettled) {
                isSettled = true;
                event.resolve({
                    emailRequired: true,
                    phoneNumberRequired: true,
                    shippingAddressRequired: true,
                    shippingRates: []
                });
            }
        }, 800);

        bodyData.shippingAddress = JSON.stringify(event.address);
        bodyData.shippingName = event.name;
        $.ajax({
            url: $('#stripe_get_shipping_options').val(),
            method: 'GET',
            data: bodyData,
            success: function(data) {
                clearTimeout(fallbackTimeout);
                if (isSettled) {
                    return;
                }

                isSettled = true;
                setCachedShippingOptions(data);

                event.resolve({
                    emailRequired: true,
                    phoneNumberRequired: true,
                    shippingAddressRequired: true,
                    shippingRates: normalizeShippingRates(data && data.shippingMethods)
                });
            },
            error: function() {
                clearTimeout(fallbackTimeout);
                if (!isSettled) {
                    isSettled = true;
                    event.resolve({
                        emailRequired: true,
                        phoneNumberRequired: true,
                        shippingAddressRequired: true,
                        shippingRates: []
                    });
                }
            }
        });
    });

    expressCheckoutElement.on('confirm', function (event) {
        var stripeReturnURLInput = $('#stripe_return_url');
        var stripeReturnURL = stripeReturnURLInput.val();
        var payloadData = getProductData();

        payloadData.billingAddress = JSON.stringify(event.billingDetails.address);
        payloadData.shippingAddress = JSON.stringify(event.shippingAddress.address);
        payloadData.csrf_token = $('[name="csrf_token"]').val();
        payloadData.billingName = event.billingDetails.name;
        payloadData.shippingName = event.shippingAddress.name;
        payloadData.email = event.billingDetails.email;
        payloadData.phone = event.billingDetails.phone;
        payloadData.selectedShippingRateId = event.shippingRate.id;

        elements.submit().then(function (result) {
            if (result.error) {
                return;
            }
            $.ajax({
                url: $('#stripe_express_checkout_url').val(),
                method: 'POST',
                data: payloadData,
                success: function (data) {
                    window.localStorage.setItem('stripe_pe_continueurl', data.continueUrl);
                    window.localStorage.setItem('stripe_pe_orderid', data.orderID);
                    window.localStorage.setItem('stripe_pe_ordertoken', data.orderToken);
                    stripe.confirmPayment({
                        elements: elements,
                        clientSecret: data.clientSecret,
                        confirmParams: {
                            // Make sure to change this to your payment completion page
                            return_url: stripeReturnURL
                        }
                    }
                    ).then(function (response) {
                        if (response.error) {
                            $.ajax({
                                url: document.getElementById('logStripeErrorMessageURL').value,
                                method: 'POST',
                                dataType: 'json',
                                data: {
                                    csrf_token: $('[name="csrf_token"]').val(),
                                    msg: 'UPE stripe.confirmPayment Error ' + JSON.stringify(response.error)
                                }
                            }).done(function () {
                                $.spinner().start();

                                $.ajax({
                                    url: document.getElementById('stripeFailOrderURL').value,
                                    method: 'POST',
                                    dataType: 'json',
                                    data: {
                                        csrf_token: $('[name="csrf_token"]').val()
                                    }
                                }).done(function () {
                                    window.location.reload();
                                });
                                $.spinner().stop();
                            });
                        }
                    });
                }
            });
        });
    });

    return true;
}

function bootstrapStripeCheckoutExpress() {
    var maxAttempts = 40;
    var attemptCount = 0;

    function tryInit() {
        if (initStripeCheckoutExpress()) {
            return;
        }

        attemptCount += 1;
        if (attemptCount < maxAttempts) {
            setTimeout(tryInit, 100);
        }
    }

    tryInit();
}

/**
 * Updates Add To Cart Button and ECE
 */
function updateAddToCart() {
    $('body').on('product:updateAddToCart', function (e, response) {
        // update local add to cart (for sets)
        $('button.add-to-cart', response.$productContainer).attr('disabled',
            (!response.product.readyToOrder || !response.product.available));

        var enable = $('.product-availability').toArray().every(function (item) {
            return $(item).data('available') && $(item).data('ready-to-order');
        });

        updateExpressCheckoutElement(response.product);

        baseDetail.methods.updateAddToCartEnableDisableOtherElements(!enable);
    });
}

var ready = function (callback) {
    if (document.readyState !== 'loading') {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
};

ready(function () {
    bootstrapStripeCheckoutExpress();

    if (document.getElementById('express-checkout-element')) {
        updateAddToCart();
    }
});
