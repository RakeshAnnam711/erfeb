'use strict';

const helper = require('./helper');

/**
 * Sends a request to the place order endpoint
 * @returns {Promise<Object>} A promise that resolves to the parsed JSON response
 * @throws {Error} If the fetch request fails or the response cannot be parsed as JSON
 */
const placeOrder = async() => {
    const url = helper.getUrlWithCsrfToken(window.paypalUrls.placeOrder);

    return fetch(url, { method: 'POST' }).then(helper.parseResponseJsonOrThrow);
};

/**
 * Confirms the order by creating and submitting a form with the provided data
 * @param {Object} data - The data required to confirm the order
 * @param {string} data.orderID - The unique identifier of the order
 * @param {string} data.orderToken - The token associated with the order for verification
 * @param {string} data.continueUrl - The URL to redirect the user after order confirmation
 * @throws {Error} If the `data.error` flag is true
 */
const orderConfirm = async data => {
    helper.throwIfResponseError(data);

    const url = helper.getUrlWithCsrfToken(data.continueUrl);

    const urlInstance = new URL(url, window.location.origin);

    urlInstance.searchParams.append('orderID', data.orderID);
    urlInstance.searchParams.append('orderToken', data.orderToken);

    helper.processConfirmForm(urlInstance.toString());
};

/**
 * Handles the streamlined express checkout process (place order, and confirm order)
 * @throws {Error} If any of the asynchronous steps fail or the response cannot be parsed as JSON
 */
const handleStreamlinedExpressCheckout = () => {
    Promise.resolve()
        .then(placeOrder)
        .then(orderConfirm)
        .catch(error => {
            const AlertHandler = require('../models/alertHandler');
            const alertHandlerInstance = new AlertHandler();

            alertHandlerInstance.showError(error.message);
        });
};

/**
 * Creates billing FormData with provided payment method name
 * @param {string} usedPaymentMethodName Payment method name
 * @returns {Object} Billing form data
 */
const createBillingFormData = usedPaymentMethodName => {
    const formData = new FormData();

    formData.append('dwfrm_billing_paypal_usedPaymentMethod', usedPaymentMethodName);

    return formData;
};

module.exports = {
    handleStreamlinedExpressCheckout,
    createBillingFormData
};
