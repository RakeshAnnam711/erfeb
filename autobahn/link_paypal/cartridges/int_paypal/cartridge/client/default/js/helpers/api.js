const loaderInstance = require('../components/loader');
const helper = require('./helper');
const loaderContainerEl = document.querySelector('.paypalLoader');
const loader = loaderInstance(loaderContainerEl);
const CONTENT_TYPE_JSON = 'application/json';

/**
 * Create billing formData from fields data
 *
 * @param {Object} fieldsData - fields data values
 * @param {Element} buttonEl - button element
 * @returns {Object} cart billing form data
 */
function createCartBillingFormData(fieldsData, buttonEl) {
    const cartBillingFormData = new FormData();

    const cartBillingFields = buttonEl && JSON.parse(buttonEl.getAttribute('data-paypal-billing-form-fields'));

    Object.entries(cartBillingFields)
        .forEach(entry => {
            const [key, field] = entry;

            if (typeof field === 'object') {
                cartBillingFormData.append(field.name, fieldsData && fieldsData[key] ? fieldsData[key] : field.value);
            }
        });

    return cartBillingFormData;
}

/**
 * Call FinishLPM endpoint
 * @param {string} fundingSource The current paypal funding source
 * @returns {Promise} ajax call
 */
function finishLpmFlow(fundingSource) {
    const usedPaymentMethodEl = document.querySelector('.js-used-payment-method');
    const pmName = usedPaymentMethodEl ? usedPaymentMethodEl.value : fundingSource;

    return $.ajax({
        url: helper.getUrlWithCsrfToken(window.paypalUrls.finishLpm),
        type: 'POST',
        contentType: CONTENT_TYPE_JSON,
        data: JSON.stringify({
            pmName
        })
    });
}

/**
 * Makes call on saving a PayPal default address to the storefront customer.
 * @param {Object} addressObject PayPal address information.
 * @param {boolean} isAccountPage Identifies whether the source page is account.
 * @returns {Object} Whether a success or failed JSON response body.
 */
function savePaypalDefaultAddress(addressObject, isAccountPage) {
    return $.ajax({
        url: helper.getUrlWithCsrfToken(window.paypalUrls.savePaypalDefaultAddress),
        type: 'POST',
        contentType: CONTENT_TYPE_JSON,
        data: JSON.stringify({ addressObject, isAccountPage })
    });
}

/**
 * Finish a LPM payment
 * @param {string} usedPaymentMethod Current payment method name
 */
function finishLpmPayment(usedPaymentMethod) {
    finishLpmFlow(usedPaymentMethod)
        .then(({ redirectUrl }) => {
            loader.hide();
            helper.processConfirmForm(redirectUrl);
        })
        .catch(function() {
            loader.hide();
        });
}

/**
 * Creates and sets a PayPal order id
 * @param {Object} [options] Options
 * @param {Object} [options.paymentSourceData] The payment source data (card, apple_pay...)
 * @param {boolean} [options.isExpressCheckout] Indicates if it is EC flow
 * @param {boolean} [options.isLocalPaymentMethod] Indicates if it is LPM flow
 * @returns {Object} response with PayPal order id
 */
function getPaypalOrderId(options = {}) {
    const data = Object.assign({
        paymentSourceData: null,
        isExpressCheckout: false,
        isLocalPaymentMethod: false,
        currentPage: helper.getCurrentPage(),
        pid: helper.getPidForPVP()
    }, options);

    let url = helper.getUrlWithCsrfToken(window.paypalUrls.getPaypalOrderId);

    Object.entries(data)
        .filter(([, value]) => ![null, undefined, ''].includes(value))
        .forEach(([key, value]) => {
            value = typeof value === 'object' ? JSON.stringify(value) : value;

            url += `&${key}=${value}`;
        });

    return $.ajax({
        url: url,
        type: 'GET',
        contentType: CONTENT_TYPE_JSON,
        async: false
    }).responseJSON;
}

/**
 * Create the Apple Pay order
 * @param {Object} paymentSource The Apple Pay payment source object
 * @returns {Promise} The promise resolved with the data object
 */
const createApplePayOrder = paymentSource => {
    return fetch(helper.getUrlWithCsrfToken(window.paypalUrls.createApplePayOrder), {
        method: 'POST',
        headers: {
            'Content-Type': CONTENT_TYPE_JSON
        },
        body: JSON.stringify(paymentSource)
    })
        .then(response => response.json());
};

/**
 * Gets the basket data
 * @returns {Promise} The promise resolved with the basket data
 */
const getBasketData = () => {
    const url = helper.getUrlWithCsrfToken(window.paypalUrls.getBasketData);

    return $.ajax({
        url: url,
        type: 'GET',
        contentType: CONTENT_TYPE_JSON,
        async: false
    }).responseJSON;
};

/**
 * Gets the order billing address data
 * @returns {Promise} The promise resolved with the order billing address data
 */
const getOrderBillingAddress = () => {
    const url = helper.getUrlWithCsrfToken(window.paypalUrls.getOrderBillingAddress);

    return $.ajax({
        url: url,
        type: 'GET',
        contentType: CONTENT_TYPE_JSON,
        async: false
    }).responseJSON;
};

/**
 * Creates Payment Token and adds Paypal account
 * @param {Object} params - Additional parameters
 * @param {boolean} [params.isAPMA] - Additional payment method adding flow
 */
async function addPaypalAccount(params = {}) {
    let url = helper.getUrlWithCsrfToken(window.paypalUrls.accountAddPaypalHandler);

    if (params.isAPMA) {
        url += '&isAPMA=true';
    }

    const response = await fetch(url, {
        method: 'POST'
    });

    return response.json();
}

/**
 * Creates Setup Token
 */
async function createSetupToken() {
    const response = await fetch(helper.getUrlWithCsrfToken(window.paypalUrls.createSetupTokenForPaypal), {
        method: 'POST'
    });

    return response.json();
}

/**
 * Gets applicable shipping options for selected shipping address
 * @param {string} url the url to get Applicable Shipping Options
 * @returns {Object} object with default shipping option id and list of applicable shipping options for selected shipping address
 */
async function getApplicableShippingOptions(url) {
    const AlertHandlerModel = require('../models/alertHandler');
    const alertHandlerInstance = new AlertHandlerModel();

    const result = {};

    const response = await fetch(helper.getUrlWithCsrfToken(url));

    if (response.ok) {
        const data = await response.json();

        if (data.error) {
            result.error = data.error;
            result.errors = data.errors;
        } else {
            result.applicableShippingMethods = data.applicableShippingMethods;
            result.defaultShippingOptionId = data.defaultShippingOptionId;
        }
    } else {
        alertHandlerInstance.showError(window.i18nMessages.INTERNAL_SERVER_ERROR);
    }

    return result;
}

/**
 * Sends the enriched nonce to the server and saves it in the basket.
 * @param {string} nonce - The enriched payment nonce to be stored.
 * @returns {Promise<Object>} A promise that resolves to the parsed JSON response from the server.
 */
function saveEnrichedNonce(nonce) {
    return fetch(helper.getUrlWithCsrfToken(window.paypalUrls.saveEnrichedNonce), {
        method: 'POST',
        headers: {
            'Content-Type': CONTENT_TYPE_JSON
        },
        body: JSON.stringify({ nonce })
    })
        .then(response => response.json());
}

/**
 * Gets the ThreeDSecure parameters
 * @returns {Promise} The promise resolved with ThreeDSecure parameters
 */
const createThreeDSecureParameters = () => {
    return fetch(helper.getUrlWithCsrfToken(window.paypalUrls.createThreeDSecureParameters), {})
        .then(response => response.json());
};

module.exports = {
    addPaypalAccount,
    createSetupToken,
    finishLpmFlow,
    createCartBillingFormData,
    savePaypalDefaultAddress,
    finishLpmPayment,
    getPaypalOrderId,
    createApplePayOrder,
    getBasketData,
    getOrderBillingAddress,
    getApplicableShippingOptions,
    saveEnrichedNonce,
    createThreeDSecureParameters
};
