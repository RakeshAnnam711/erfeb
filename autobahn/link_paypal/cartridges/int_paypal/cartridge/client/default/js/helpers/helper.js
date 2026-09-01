'use strict';

const HIDE_CLASS = 'none';
const PRODUCT_DETAIL_CLASS = '.product-detail';
const PDP_PRICE_VALUE_CLASS = '.price .sales .value';
const INVALID_CLASSNAME = 'is-invalid';
const EMPTY_STRING = '';
const ATTRIBUTE_NAME_CUSTOMER_EMAIL = 'data-customer-email';

const base = require('base/product/base');

/**
 * Extracts a floating-point number from a string containing a monetary amount
 * @param {string|number} amount - The string representing a monetary amount
 * @returns {number} - The extracted floating-point value from the string
 * @throws {TypeError} - Throws if the input is not a string.
 */
function getFloatFromAmount(amount) {
    if (typeof amount === 'number') {
        return amount;
    }

    if (typeof amount !== 'string') {
        throw new TypeError('Amount must be a string');
    }

    const numeric = amount.trim().replace(/[^\d,.-]/g, '');
    const decimal = numeric.lastIndexOf(',') > numeric.lastIndexOf('.') ? ',' : '.';
    const normalized = numeric.replace(new RegExp(`[^\\d${decimal}-]`, 'g'), '').replace(decimal, '.');

    return parseFloat(normalized) || 0;
}

/**
 * Filter styles for Venmo button
 * @param {Object} buttonConfig - Button style config
 * @param {Object} buttonConfig.style - Style config
 * @returns {Object} - Filtered styles for Venmo button
 */
function filterButtonStyleForVenmo({ style }) {
    return {
        ...style,
        color: style.color === 'gold' ? 'blue' : style.color
    };
}

/**
 *  Gets paypal button styles
 * @param {Element} button - button element
 * @returns {Object} with button styles or if error appears with default styles
 */
function getPaypalButtonStyle(button) {
    try {
        const config = button.getAttribute('data-paypal-button-config');

        if (config) {
            const buttonConfigs = JSON.parse(config);

            return button.dataset.funding === 'venmo' ? filterButtonStyleForVenmo(buttonConfigs) : buttonConfigs.style;
        }

        return {};
    } catch (error) {
        return {};
    }
}

/**
 * Gets PayPal button styles
 * @param {Element} button - button element
 * @returns {Object} with button styles or if error appears with default styles
 */
function getPaypalButtonMessageStyle(button) {
    return this.tryParseJSON(button.getAttribute('data-paypal-button-message-config'));
}

/**
 * Creates a redirecting form to Order-Confirm endpoint
 * @param {Object} param The helping object for creating a from
 * @returns {Object} form element
 */
function createConfirmForm(param) {
    const form = $('<form>')
        .appendTo(document.body)
        .attr({
            method: 'POST',
            action: param.url
        });

    $('<input>')
        .appendTo(form)
        .attr({
            name: 'orderID',
            value: param.orderID
        });

    $('<input>')
        .appendTo(form)
        .attr({
            name: 'orderToken',
            value: param.orderToken
        });

    return form;
}

/**
 * Prepare and submits form in order to confirm order with Lpm
 * @param {string} redirectUrl Redirect Url
 */
function processConfirmForm(redirectUrl) {
    const splitUrl = redirectUrl.split('?');
    const url = splitUrl[0];
    const paramsString = splitUrl[1];
    const searchParams = new URLSearchParams(paramsString);
    const formParam = {
        orderID: searchParams.get('orderID'),
        orderToken: searchParams.get('orderToken'),
        url: url
    };

    const form = createConfirmForm(formParam);

    form.submit();
}

/**
 * Return payment method name in lowercase
 * @param {string} paymentMethodName Payment method name
 * @returns {string} Payment method name
 */
function getPaymentMethodToLowerCase(paymentMethodName) {
    const paymentMethod = paymentMethodName.split('_');

    if (paymentMethod.length === 1) {
        return paymentMethodName;
    }

    paymentMethod.forEach(function(element, index) {
        paymentMethod[index] = element.charAt(0) + element.slice(1).toLocaleLowerCase();
    });

    return paymentMethod.length ? paymentMethod.join(' ') : paymentMethod[0];
}

/**
 * Creates an HTML element with the specified tag and text.
 * @param {string} tag - The tag name for the new element.
 * @param {string} text - The text content for the new element.
 * @returns {HTMLElement} A new HTML element with the specified tag and text.
 */
function createHTMLElementWithText(tag, text) {
    const element = document.createElement(tag);

    element.textContent = text;

    return element;
}

/**
 * Updates html div view
 * @param {Object} order Order object
 * @param {Array<HTMLElement>} html Array of HTML elements
 * @returns {Array<HTMLElement>} Updated array of HTML elements
 */
function appendHtml(order, html) {
    const payment = order.billing.payment;

    payment.selectedPaymentInstruments.forEach(function(selectedPaymentInstrument) {
        const paymentMethodId = selectedPaymentInstrument.paymentMethod;
        const fundingSource = selectedPaymentInstrument.fundingSource;
        const isVenmoUsed = fundingSource === window.paypalConstants.PAYMENT_METHOD_ID_VENMO
            && document.getElementById('venmo-content').classList.contains('active');

        const availablePaymentMethods = [
            window.paypalConstants.PAYMENT_METHOD_ID_PAYPAL,
            window.paypalConstants.PAYMENT_METHOD_ID_VENMO,
            window.paypalConstants.PAYMENT_METHOD_ID_APPLE_PAY,
            window.paypalConstants.PAYMENT_METHOD_ID_GOOGLE_PAY
        ];

        if (fundingSource === window.paypalConstants.PP_DEBIT_CREDIT_PAYMENT_TYPE) {
            html.push(createHTMLElementWithText('div', window.paypalConstants.PP_DEBIT_CREDIT_PAYMENT_TYPE));
        } else if (isVenmoUsed) {
            html.push(createHTMLElementWithText('div', window.paypalConstants.PAYMENT_METHOD_ID_VENMO));
        } else if (fundingSource === window.paypalConstants.PAYMENT_METHOD_ID_GOOGLE_PAY) {
            html.push(createHTMLElementWithText('div', window.paypalConstants.PAYMENT_METHOD_ID_GOOGLE_PAY));
        } else {
            html.push(createHTMLElementWithText('div', getPaymentMethodToLowerCase(paymentMethodId)));
        }

        if (paymentMethodId !== window.paypalConstants.PAYMENT_METHOD_ID_PAYPAL
            && selectedPaymentInstrument.maskedCreditCardNumber) {
            html.push(createHTMLElementWithText('div', selectedPaymentInstrument.maskedCreditCardNumber));
        }

        if (availablePaymentMethods.includes(paymentMethodId)) {
            const text = [selectedPaymentInstrument.accountHolderResource, selectedPaymentInstrument.paypalAccountHolder].join(' ');

            html.push(createHTMLElementWithText('div', text));
        }

        if (selectedPaymentInstrument.type) {
            html.push(createHTMLElementWithText('div', selectedPaymentInstrument.type));
        }

        html.push(createHTMLElementWithText('div', [order.priceTotal.charAt(0), selectedPaymentInstrument.amount].join('')));
    });

    return html;
}

/**
 * Updates checkout view
 * @param {Object} data Data object
 */
function updateCheckoutView(data) {
    const paymentSummaryEl = document.querySelector('.summary-details .payment-details')
        || document.querySelector('.summary-details .js-paypal-payment-details');

    const cardHolderInputEl = document.getElementById('paypalCardOwner');
    const order = data.order;
    const payment = order.billing.payment;

    let htmlToAppend = [];

    if (paymentSummaryEl && paymentSummaryEl.classList.contains('payment-details')) {
        // Overwrites a basic class to show a correct payment PayPal related data for buyer
        paymentSummaryEl.classList.remove('payment-details');
        paymentSummaryEl.classList.add('js-paypal-payment-details');
    }

    if (payment && payment.selectedPaymentInstruments && payment.selectedPaymentInstruments.length > 0) {
        htmlToAppend = appendHtml(order, htmlToAppend);
    }

    if (paymentSummaryEl && htmlToAppend.length > 0) {
        paymentSummaryEl.innerHTML = '';

        htmlToAppend.forEach(element => {
            paymentSummaryEl.appendChild(element);
        });
    }

    if (cardHolderInputEl) {
        cardHolderInputEl.value = '';
    }
}

/**
 * @param {Object} error - an error object data
 * @returns {boolean} - if an error message is displayed then true otherwise false
 */
function handleValidationAddressResult(error) {
    const errorMessage = error.responseText ?? error.message;

    if (error.status === 422 && /(sh|b)i(p|l){2}ing/i.test(errorMessage)) {
        const AlertHandlerModel = require('../models/alertHandler');
        const alertHandler = new AlertHandlerModel();

        alertHandler.showError(errorMessage);

        return true;
    }

    return false;
}

/**
 * Shows button element
 * @param {Object} button - button element
 */
function showButton(button) {
    button.classList.remove(HIDE_CLASS);
}

/**
 * Hides button element
 * @param {Object} button - button element
 */
function hideButton(button) {
    button.classList.add(HIDE_CLASS);
}

/**
 * Check if product price value is equal to zero (0.00)
 * @returns {boolean} - a true for zero value or false
 */
function isProductZeroAmount() {
    const elements = document.querySelectorAll(PDP_PRICE_VALUE_CLASS);

    if (elements.length === 0) {
        return false;
    }

    return Array.from(elements).every(element => element.getAttribute('content') === '0.00');
}

/**
 * Get minicart quantity
 * @returns {number} - a quantity
 */
function getMiniCartQuantity() {
    const element = document.querySelector('.minicart-quantity');

    return element ? parseInt(element.textContent, 0) : 0;
}

/**
 * Handling PVP button behavior on Quick View
 * @param {Array<HTMLElement>} paypalButtons - paypal button elements
 * @returns {void}
 */
function initPaypalButtonBehaviorOnPvp(paypalButtons) {
    const api = require('./api');

    const basketData = api.getBasketData();
    const isProductReadyToOrderElement = document.querySelector('.js-is-show-pp-button');
    const isProductReadyToOrder = isProductReadyToOrderElement && isProductReadyToOrderElement.value === 'true';

    const addToCartButton = document.querySelector('.add-to-cart, .add-to-cart-global');

    // Check minicart quantity and hide Paypal button if it is not empty
    if (getMiniCartQuantity() > 0 || isProductZeroAmount() || (basketData?.amount !== 0)) {
        paypalButtons.forEach((paypalButton) => hideButton(paypalButton));
    }

    if (addToCartButton.disabled || !isProductReadyToOrder) {
        paypalButtons.forEach((paypalButton) => hideButton(paypalButton));
    }

    $('body').on('product:statusUpdate', function() {
        if (getMiniCartQuantity() === 0 && !isProductZeroAmount()) {
            if (addToCartButton.disabled) {
                paypalButtons.forEach((paypalButton) => hideButton(paypalButton));
            }

            if (!addToCartButton.disabled) {
                paypalButtons.forEach((paypalButton) => showButton(paypalButton));
            }
        } else {
            paypalButtons.forEach((paypalButton) => hideButton(paypalButton));
        }
    });
}

/**
 * Handling PayPal button visibility on cart/product update
 * @param {HTMLElement} addToCartButton - add to cart button element
 * @returns {void}
 */
function handleSetPayPalButtonOnUpdate(addToCartButton) {
    const miniCartQuantity = getMiniCartQuantity();

    const paypalButton = addToCartButton.parentElement
        .querySelector('.paypal-pvp-button, .paypal-pvp-button-global, .paypal-pdp-button, .paypal-pdp-button-global');

    const setItemContainerEl = addToCartButton.closest('.set-item, .modal-footer, .bundle-footer');
    const price = setItemContainerEl.querySelector(PDP_PRICE_VALUE_CLASS);

    const isWrongAmount = price && parseFloat(price.getAttribute('content')) <= 0;

    if (miniCartQuantity === 0 && !isWrongAmount) {
        if (addToCartButton.disabled) {
            hideButton(paypalButton);
        } else {
            showButton(paypalButton);
        }
    } else {
        hideButton(paypalButton);
    }
}

/**
 * Handling button behavior on Product Set
 * @returns {void}
 */
function initPayPalBtnBehaviorOnSet() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart, .add-to-cart-global');

    const miniCartQuantity = getMiniCartQuantity();

    addToCartButtons.forEach((btn) => {
        const paypalButton = btn.parentElement
            .querySelector('.paypal-pvp-button, .paypal-pvp-button-global, .paypal-pdp-button, .paypal-pdp-button-global');

        const isProductReadyToOrderElement = btn.parentElement.querySelector('.js-is-show-pp-button');
        const isProductReadyToOrder = isProductReadyToOrderElement && isProductReadyToOrderElement.value === 'true';

        const setItemContainerEl = btn.closest('.set-item, .modal-footer, .bundle-footer');
        const price = setItemContainerEl.querySelector(PDP_PRICE_VALUE_CLASS);

        const isWrongAmount = price && parseFloat(price.getAttribute('content')) <= 0;

        if (miniCartQuantity === 0 && !isWrongAmount && isProductReadyToOrder) {
            if (btn.disabled) {
                hideButton(paypalButton);
            } else {
                showButton(paypalButton);
            }
        } else {
            hideButton(paypalButton);
        }
    });

    $('body').on('product:statusUpdate', (event) => handleSetPayPalButtonOnUpdate(event.target));
}

/**
 * Get CSRF Token
 * @returns {string} - csrf token value
 */
function getCsrfToken() {
    let element = document.querySelector('[name="csrf_token"]');

    if (element && element.value !== '') {
        return element.value;
    }

    element = document.querySelector('[data-tokenname="csrf_token"]');

    if (element && element.getAttribute('data-token') !== '') {
        return element.getAttribute('data-token');
    }

    return '';
}

/**
 * Add csrf token param to url
 * @param {string} url - source url
 * @returns {string} - url with csrf_token param
 */
function getUrlWithCsrfToken(url) {
    const urlInstance = new URL(url, window.location.origin);

    urlInstance.searchParams.append('csrf_token', getCsrfToken());

    return urlInstance.toString();
}

/**
 * Gets options
 * @param {HTMLElement} productContainer - product container
 * @returns {string} options
 */
function getOptions(productContainer) {
    return JSON.stringify(Array.from(productContainer.querySelectorAll('.product-option'))
        .map(elOption => {
            const selectedValue = elOption.querySelector('.options-select').value;
            const selectedOption = elOption.querySelector(`.options-select option[value="${selectedValue}"]`);

            return {
                optionId: elOption.getAttribute('data-option-id'),
                selectedValueId: selectedOption.getAttribute('data-value-id')
            };
        }));
}

/**
 * It takes a selector for a PayPal button, and returns an object with the product ID and quantity of
 * the product that the button is for.
 *
 * @param {string} ppBtnSelector - PayPal button container selector.
 * @returns {Object} add to cart result
 */
function addProductToCart(ppBtnSelector) {
    const ppBtn = document.querySelector(ppBtnSelector);
    const bundleItems = document.querySelectorAll('.bundle-item');
    const setItems = document.querySelectorAll('.set-item');

    const ppBtnContainer = ppBtn.closest('.paypal-pvp-button-global, .paypal-pdp-button-global')
        || ppBtn.closest('.paypal-pdp-button, .paypal-pvp-button');

    const isGlobalButton = ['paypal-pvp-button-global', 'paypal-pdp-button-global'].some(className => ppBtnContainer.classList.contains(className));

    const pid = base.getPidValue(ppBtnContainer);

    let productContainer;
    let form = {};

    if (isGlobalButton || !setItems.length) {
        productContainer = document.querySelector(ppBtnSelector).closest(PRODUCT_DETAIL_CLASS) || document.querySelector(PRODUCT_DETAIL_CLASS);
    } else {
        productContainer = document.querySelector(ppBtnSelector).closest('.set-item');
    }

    if (bundleItems.length) {
        const quantity = document.querySelector('.modal-footer, .bundle-footer').querySelector('.quantity-select').value;

        form = {
            pid: pid,
            quantity: quantity
        };

        const items = Array.from(bundleItems).map(function(item) {
            return {
                pid: item.querySelector('.product-id').innerText,
                quantity: parseInt(item.querySelector('.quantity').getAttribute('data-quantity'), 10)
            };
        });

        form.childProducts = JSON.stringify(items);
    } else if (setItems.length && isGlobalButton) {
        const items = Array.from(setItems).map(function(item) {
            return {
                pid: base.getPidValue(item),
                qty: parseInt(base.getQuantitySelected(item), 10),
                options: getOptions(item)
            };
        });

        form.pidsObj = JSON.stringify(items);
    } else {
        form = {
            pid: pid,
            quantity: base.getQuantitySelected(ppBtnContainer),
            options: getOptions(productContainer)
        };
    }

    return $.ajax({
        url: $('.add-to-cart-url').val(),
        method: 'POST',
        async: false,
        data: form
    }).responseJSON;
}

/**
 * Removes all products from the cart in case if an error occurred
 */
function removeAllProductsFromCart() {
    const url = getUrlWithCsrfToken(window.paypalUrls.removeAllProductsFromCart);

    fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
        .finally(() => {
            $.spinner().stop();
        });
}

/**
 * Makes the redirect to the provided url after streamlinedCheckout endpoint execution
 * @param {Object} data A response data object from StreamlinedCheckout endpoint
 */
function streamlinedCheckoutRedirect(data) {
    const url = data.error ? data.redirectURL : window.paypalUrls.placeOrderStage;

    window.location.href = url;
}

/**
 * The function calls StreamlinedCheckout route and redirects the user easer to the place or confirm order stage.
 * @param {Object} - object from onApprove function.
 * @returns {Promise} object that resolves to undefined.
 */
function streamlinedCheckout({ isBillingPage }) {
    const api = require('./api');
    const streamLinedCheckoutHelper = require('./streamlinedCheckout');

    const basketData = api.getBasketData();
    const that = this;
    const url = getUrlWithCsrfToken(window.paypalUrls.streamlinedCheckout);

    let statusCode;
    let formData;

    if (isBillingPage) {
        formData = streamLinedCheckoutHelper.createBillingFormData(that.usedPaymentMethodName);
    } else if (that.usedPaymentMethodName) {
        formData = api.createCartBillingFormData(
            {
                usedPaymentMethod: that.usedPaymentMethodName
            },
            that.payPalBtnContainerEl);
    } else {
        formData = api.createCartBillingFormData({}, that.payPalButton);
    }

    return fetch(url, {
        method: 'POST',
        body: formData
    })
        .then((response) => {
            if (!response.ok && basketData?.amount === 0) {
                throw Object.assign(new Error(window.i18nMessages.ZERO_AMOUNT), { code: window.paypalConstants.ZERO_AMOUNT });
            }

            if (!response.ok) {
                statusCode = response.status;

                return response.text();
            }

            return response.json();
        })
        .then((data) => {
            if (typeof data === 'string') {
                throw Object.assign(new Error(data), { status: statusCode });
            }

            if (window.paypalPreferences.isStreamlinedCheckout) {
                streamLinedCheckoutHelper.handleStreamlinedExpressCheckout();
            } else {
                this.loader?.hide();

                streamlinedCheckoutRedirect(data);
            }
        });
}

/**
 * function to proceed a save parsing
 * @param {string} element string what should be parsed
 * @returns {Object} result of parsing
 */
function tryParseJSON(element) {
    const AlertHandlerModel = require('../models/alertHandler');
    const alertHandler = new AlertHandlerModel();

    let result = null;

    try {
        result = JSON.parse(element);
    } catch (error) {
        alertHandler.showError(window.i18nMessages.INTERNAL_SERVER_ERROR);
    }

    return result;
}

/**
 * @param {mixed} value object key
 * @param {mixed} defaultValue default value
 * @returns {mixed} return current or default value
 */
function getValueOr(value, defaultValue) {
    return value || defaultValue;
}

/**
 * The function updates the data attributes of a DOM element with the values from a billing address object.
 * @param {Object} billingAddress - an object that contains information about a billing address.
 * @param {string} optionClassName - a class name of option to update the attributes.
 * @returns {void}
 */
function updateOptionDataAttribute(billingAddress, optionClassName) {
    const optionEl = document.querySelector(`.${optionClassName}`);

    Object.entries(billingAddress).forEach(([key, val]) => {
        if (key === 'countryCode') {
            optionEl.dataset[key] = val.value;
        } else {
            optionEl.dataset[key] = val;
        }
    });
}

/**
 * The function takes a billing address object and returns a string representation of the address.
 * @param {Object} billingAddress - an object that contains information about a billing address.
 * @returns {string} - a billing address converted to a string in specific format.
 */
function getBillingAddressAsString(billingAddress) {
    let billingAddressStringRepresentation = '';

    if (billingAddress && Object.keys(billingAddress).length) {
        const firstName = getValueOr(billingAddress.firstName, '');
        const lastName = getValueOr(billingAddress.lastName, '');
        const address1 = getValueOr(billingAddress.address1, '');
        const address2 = getValueOr(billingAddress.address2, '');
        const city = getValueOr(billingAddress.city, '');
        const state = getValueOr(billingAddress.stateCode, '');
        const postalCode = getValueOr(decodeURIComponent(billingAddress.postalCode), '');

        billingAddressStringRepresentation = `${firstName} ${lastName} ${address1} ${address2} ${city}, ${state} ${postalCode}`;
    }

    return billingAddressStringRepresentation;
}

/**
 * The function is used to display a selected stored billing address in a dropdown menu.
 * @param {Object} billingAddress - an object that contains information about a billing address.
 * @param {string} optionClassName - a class name of the option that will display the selected billing address.
 * @returns {void}
 */
function displaySelectedStoredBillingAddress(billingAddress, optionClassName) {
    const billingAddressAsString = getBillingAddressAsString(billingAddress);

    if (billingAddressAsString !== '') {
        const storedCreditCardAddressOptionEl = document.querySelector(`.${optionClassName}`);

        if (storedCreditCardAddressOptionEl) {
            storedCreditCardAddressOptionEl.innerText = billingAddressAsString;
            storedCreditCardAddressOptionEl.selected = true;
            storedCreditCardAddressOptionEl.hidden = false;
        } else {
            const option = document.createElement('option');

            option.textContent = billingAddressAsString;
            option.selected = true;
            option.classList.add(optionClassName);

            document.getElementById('billingAddressSelector').append(option);
        }
    }
}

/**
 * The function updates the billing address form and displays the stored billing address.
 * @param {Element} selectedOptionEl - the selected option from a saved credit cards list.
 * @returns {void}
 */
function selectBillingAddress(selectedOptionEl) {
    const baseBilling = require('base/checkout/billing');

    const storedCcAddressClassName = 'js-stored-credit-card-address';

    if (selectedOptionEl && selectedOptionEl.id !== 'new-card-account') {
        const billingAddress = tryParseJSON(selectedOptionEl.dataset.billingAddress);
        const order = {
            billing: {
                billingAddress: {
                    address: billingAddress
                }
            }
        };

        baseBilling.methods.updateBillingAddress(order);
        displaySelectedStoredBillingAddress(billingAddress, storedCcAddressClassName);
        updateOptionDataAttribute(billingAddress, storedCcAddressClassName);
    }
}

/**
 * Validate whole form.
 * @param {HTMLElement} form - form to be validated.
 * @returns {Object} - with flag to indicate if form is valid and with an array of invalid fields
 */
function validateForm(form) {
    if (form.checkValidity && !form.checkValidity()) {
        const invalidFields = Array.from(form.querySelectorAll('input, select')).reduce((accum, element) => {
            if (!element.validity.valid) {
                element.classList.add(INVALID_CLASSNAME);
                accum.push(element);
            }

            return accum;
        }, []);

        return {
            isValid: false,
            invalidFields: invalidFields
        };
    }

    return {
        isValid: true
    };
}

/**
 * Calculates the centered position for an element with the given width and height on the user's screen.
 *
 * @param {number} width - The width of the element.
 * @param {number} height - The height of the element.
 * @returns {Object} An object containing the `left` and `top` properties, which represent the coordinates of the centered position.
 */
function getCenteredPosition(width, height) {
    const h = window.innerHeight || document.documentElement.clientHeight;
    const w = window.innerWidth || document.documentElement.clientWidth;

    return {
        left: (window.screenX || window.screenLeft) + ~~(w / 2) - ~~(width / 2),
        top: (window.screenY || window.screenTop) + ~~(h / 2) - ~~(height / 2)
    };
}

/**
* Gets applicable shipping options for selected shipping address
* @param {string} paymentMethodId defines formatting for shipping options for each PM
* @param {Object} shippingAddress selected shipping address from pop-up
* @returns {Object} object with default shipping option ID and a list of applicable shipping options for selected shipping address
*/
function getApplicableShippingOptions(paymentMethodId, shippingAddress) {
    const api = require('../helpers/api');

    let queryString = `paymentMethodId=${paymentMethodId}`;

    if (shippingAddress) {
        const city = shippingAddress.locality;
        const stateCode = shippingAddress.administrativeArea;
        const countryCode = shippingAddress.countryCode;
        const postalCode = shippingAddress.postalCode;

        queryString += `&city=${city}&stateCode=${stateCode}&countryCode=${countryCode}&postalCode=${postalCode}`;
    }

    const url = `${window.paypalUrls.getApplicableShippingOptions}?${queryString}`;

    return api.getApplicableShippingOptions(url);
}

/**
 * Gets updated order amount and tax when a certain shipping option gets selected
 * @param {string} shippingOptionID the id of the user chosen shipping method from Apple Pay pop-up
 * @param {string} url the url to get updated amount and tax
 * @returns {Object} object with updated amount and tax
 */
async function updateAmountForShippingOption(shippingOptionID, url) {
    return fetch(getUrlWithCsrfToken(url), {
        method: 'POST',
        body: shippingOptionID
    })
        .then((response) => {
            if (!response.ok) {
                window.location.reload();
            }

            return response.json();
        })
        .then((data) => {
            return {
                amount: data.amount,
                totalTax: data.totalTax,
                currencyCode: data.currencyCode
            };
        });
}

/**
 * Checks if the PayPal CardFields is eligible.
 * @returns {boolean} - Returns true if CardFields is eligible, otherwise false.
 */
function isCardFieldsEligible() {
    return Boolean(window?.paypal?.CardFields?.().isEligible?.());
}

/**
 * Checks if the PayPal Buttons is eligible.
 * @returns {boolean} - Returns true if PayPal Buttons is eligible, otherwise false.
 */
function isPayPalButtonEligible() {
    return Boolean(window.paypal?.Buttons().isEligible());
}

/**
 * Gets billing data object from attribute
 * @param {HTMLElement} element element with data attribute
 * @returns {Object} - billing address object with data from option attribute
 */
function getBillingAddressFromDataAttr(element) {
    return {
        firstName: element?.dataset?.firstName || '',
        lastName: element?.dataset?.lastName || '',
        address1: element?.dataset?.address1 || '',
        address2: element?.dataset?.address2 || '',
        city: element?.dataset?.city || '',
        stateCode: element?.dataset?.stateCode || '',
        postalCode: element?.dataset?.postalCode || ''
    };
}

/**
 * Gets selected option from select
 * @param {HTMLSelectElement} selector select element with options
 * @returns {HTMLOptionElement} - selected option
 */
function getSelectedOption(selector) {
    return Array.from(selector.options).find((option) => option.selected);
}

/**
 * Sets passed textContent to specific element
 * @param {HTMLElement} element element to which text content is set
 * @param {string} content text content
 */
function setTextContent(element, content) {
    element.textContent = content;
}

/**
 * Update billing address form for Digital Goods (Pay Now) flow
 */
function updateBillingAddressForDigitalGoodsFlow() {
    if (window.paypalPreferences.isDigitalGoodsFlowEnabled && !document.getElementById('dwfrm_billing')?.checkValidity()) {
        const response = require('./api').getOrderBillingAddress();
        const baseBilling = require('base/checkout/billing');

        baseBilling.methods.updateBillingAddress(response.order);
    }
}

/**
 * Return amount from front side according to page type
 * @param {string} pageType current page type
 * @return {number} float amount from page
 */
function getPageAmount(pageType) {
    let amountSelector;

    switch (pageType) {
        case 'checkout':
            amountSelector = '.grand-total-sum';

            break;
        case 'cart':
            amountSelector = '.grand-total';

            break;
        case 'minicart':
        case 'mini-cart':
            amountSelector = '.sub-total';

            break;
        case 'product-listing':
        case 'product-details':
            amountSelector = '.prices .price .sales';

            break;
    }

    const amount = document.querySelector(amountSelector)?.textContent || '0';

    return getFloatFromAmount(amount);
}

/**
 * Get product price based on its price type
 * @param {Object} product - product information from backend
 * @return {number|string} - calculated price or empty string
 */
function getProductPrice(product) {
    switch (product.price.type) {
        case 'range':
            return parseFloat(product.price.max.sales.value) * parseFloat(product.selectedQuantity);
        case 'tiered':
            const productTiers = product.price.tiers;
            const tierData = productTiers.find((tier) => tier.quantity === product.selectedQuantity);

            // If specific tier price for selected quantity exists - show defined price
            if (tierData) {
                return parseFloat(tierData.price.sales.value);
            }

            // If specific tier price for selected quantity does not exist - look for 1 item price and multiply by quantity
            if (product.selectedQuantity !== 1) {
                const oneItemTierData = productTiers.find((tier) => tier.quantity === 1);

                return parseFloat(oneItemTierData.price.sales.value) * parseFloat(product.selectedQuantity);
            }

            // Return empty string in case product price for 1 item and specific quantity price are not defined
            return '';
        default:
            return parseFloat(product.price.sales.value) * parseFloat(product.selectedQuantity);
    }
}

/**
 * Sets initial shipping option to the basket if EC pop-up was canceled
 */
function setInitialShippingOption() {
    fetch(getUrlWithCsrfToken(window.paypalUrls.setInitialShippingOption), { method: 'POST' });
}

/**
 * Throws an error if the response contains an error.
 * @param {Object} response - Response object from API or service.
 * @param {boolean} response.error - Indicates whether an error occurred.
 * @param {string} [response.errorMessage] - Optional error message describing the error.
 * @param {string|number} response.code - Error code identifying the error type.
 * @throws {Error} Throws an error containing the response's error message (if provided) and code.
 */
function throwIfError(response) {
    if (response.error) {
        throw Object.assign(new Error(response.errorMessage ?? ''), { code: response.code });
    }
}

/**
 * Get an error message
 * @param {Error} error - An error object
 * @param {string} [defaultMessage] - A default message
 * @returns {string} - An error message
 */
function getErrorMessage(error, defaultMessage = null) {
    if (typeof error === 'string') {
        return error;
    }

    switch (error?.code) {
        case window.paypalConstants.ZERO_AMOUNT: return window.i18nMessages.ZERO_AMOUNT;
        case window.paypalConstants.GOOGLEPAY_PHONE_NUMBER_INVALID: return error.message;
    }

    return defaultMessage ?? window.i18nMessages.INTERNAL_SERVER_ERROR;
}

/**
 * Detects the type of navigation (reload, navigate, back_forward, etc.)
 * @returns {string} One of: 'navigate', 'reload', 'back_forward', 'prerender', 'unknown'
 */
function getNavigationType() {
    const UNKNOWN = 'unknown';
    const navEntries = performance.getEntriesByType?.('navigation');

    if (Array.isArray(navEntries) && navEntries.length > 0) {
        return navEntries[0].type || UNKNOWN;
    }

    return UNKNOWN;
}

/**
 * Assigns an email address to the payment source.
 * @param {Object} paymentSource - The payment source object.
 * @param {string} emailAddress - The email address to assign to the PayPal payment source.
 */
function assignEmailToPaymentSource(paymentSource, emailAddress) {
    if (emailAddress) {
        paymentSource.email_address = emailAddress;
    }
}

/**
 * Sets or updates the `data-customer-email` attribute on a DOM element
 * @param {Object} data - Response data from checkout:updateCheckoutView event
 * @param {Object} data.order - Order object containing email
 * @param {string} [data.order.orderEmail] - Email from the order
 * @param {Object} data.customer - Customer object
 * @param {Object} [data.customer.profile] - Customer profile object
 * @param {string} [data.customer.profile.email] - Email from the customer profile
 */
function setDataAttributeCustomerEmail({ order, customer }) {
    const element = document.querySelector(`[${ATTRIBUTE_NAME_CUSTOMER_EMAIL}]`);

    const currentValue = element?.dataset.customerEmail;
    const customerEmail = order.orderEmail || customer.profile?.email || EMPTY_STRING;

    if (typeof currentValue === 'string' && (currentValue === EMPTY_STRING || currentValue !== customerEmail)) {
        element.setAttribute(ATTRIBUTE_NAME_CUSTOMER_EMAIL, customerEmail);
    }
}

/**
 * Validates a fetch response and parses it as JSON
 * Throws an error if the response is not successful (response.ok === false)
 * @param {Response} response - The response object returned by fetch
 * @returns {Promise<any>} - A promise that resolves to the parsed JSON data
 * @throws {Error} - If the response status indicates an error
 */
function parseResponseJsonOrThrow(response) {
    if (!response.ok) {
        throw new Error(window.i18nMessages.INTERNAL_SERVER_ERROR);
    }

    return response.json();
}

/**
 * Checks for logical errors in the response object and throws if any are found
 * @param {Object} [data] - Response data from the server
 * @throws {Error} If the data contains error indicators
 */
function throwIfResponseError(data = {}) {
    if (!data.error) {
        return;
    }

    let errorMessage = data.customerErrorMessage ?? data.errorMessage ?? window.i18nMessages.INTERNAL_SERVER_ERROR;

    if (Array.isArray(data.fieldErrors) && data.fieldErrors.length) {
        errorMessage = data.fieldErrors.join('\n');
    }

    if (Array.isArray(data.serverErrors) && data.serverErrors.length) {
        errorMessage = data.serverErrors.join('\n');
    }

    if (data.cartError) {
        window.location.href = data.redirectUrl;

        return;
    }

    throw new Error(errorMessage);
}

/**
 * Checks if error is an interruption (window or popup close)
 * @param {Object} error - Error object to check.
 * @returns {boolean} True if error is an interruption error, otherwise false.
 */
function isInterruptionError(error) {
    return ([window.paypalConstants.WINDOW_CLOSE_DETECT_MESSAGE, window.paypalConstants.POPUP_CLOSE_DETECT_MESSAGE].includes(error.message));
}

/**
 * Returns current page name from data-action attribute (e.g. 'cart' from 'Cart-Show')
 * @returns {string} - page name
 */
function getCurrentPage() {
    const action = document.querySelector('.page[data-action]')?.dataset.action?.toLowerCase() ?? 'checkout';
    const isMinicart = Boolean(document.querySelectorAll('.minicart .popover.show').length);

    return isMinicart ? 'minicart' : action.split('-').shift();
}

/**
 * Get Product ID for PVP page
 * @returns {string|null} - Product ID or null
 */
function getPidForPVP() {
    return document.querySelector('.product-quickview')?.dataset.pid ?? null;
}

/**
 * Gets the current page type
 * @returns {string} The current page type
 */
function getPageType() {
    return Array.from(document.querySelectorAll('script[data-page-type]')).pop().getAttribute('data-page-type');
}

/**
 * Gets the product ID from the button's data attribute
 * @param {HTMLElement} button - The button element to get the product ID from
 * @returns {string|boolean} The product ID from the button's data attribute
 */
function getProductId(button) {
    return button.closest('.cart-and-ipay')?.querySelector('[data-pid]')?.dataset.pid || false;
}

/**
 * Gets the button message by product ID
 * @param {Object} buttonMessage - The button message object
 * @param {string} productId - The product ID to get the message for
 * @returns {string} The button message for the specified product ID
 */
function getButtonMessageByProductId(buttonMessage, productId) {
    return buttonMessage[productId] ?? buttonMessage.product;
}

module.exports = {
    getPaypalButtonStyle,
    getPaypalButtonMessageStyle,
    getPageAmount,
    processConfirmForm,
    updateCheckoutView,
    handleValidationAddressResult,
    initPaypalButtonBehaviorOnPvp,
    initPayPalBtnBehaviorOnSet,
    handleSetPayPalButtonOnUpdate,
    getCsrfToken,
    getUrlWithCsrfToken,
    addProductToCart,
    removeAllProductsFromCart,
    streamlinedCheckout,
    tryParseJSON,
    selectBillingAddress,
    validateForm,
    streamlinedCheckoutRedirect,
    getCenteredPosition,
    getApplicableShippingOptions,
    updateAmountForShippingOption,
    isCardFieldsEligible,
    getBillingAddressAsString,
    getBillingAddressFromDataAttr,
    getSelectedOption,
    setTextContent,
    updateBillingAddressForDigitalGoodsFlow,
    getProductPrice,
    showButton,
    hideButton,
    getFloatFromAmount,
    setInitialShippingOption,
    throwIfError,
    getErrorMessage,
    getNavigationType,
    assignEmailToPaymentSource,
    setDataAttributeCustomerEmail,
    parseResponseJsonOrThrow,
    throwIfResponseError,
    isPayPalButtonEligible,
    isInterruptionError,
    getCurrentPage,
    getPidForPVP,
    getPageType,
    getProductId,
    getButtonMessageByProductId
};
