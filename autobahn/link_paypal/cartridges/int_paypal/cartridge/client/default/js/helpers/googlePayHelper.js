'use strict';

const helper = require('../helpers/helper');

/**
 * Return base googlePay Request Object
 * @param {Object} paypalGooglePayConfig googlePay config object
 * @return {Object} base googlePay Request Object
 */
function getBaseGooglePayRequest(paypalGooglePayConfig) {
    return {
        apiVersion: paypalGooglePayConfig.apiVersion,
        apiVersionMinor: paypalGooglePayConfig.apiVersionMinor
    };
}

/**
 * Convert received amount to Money value
 * @param {string} amount received amount
 * @return {string} converted amount
 */
function getConvertedAmountToCostString(amount) {
    const amountStr = amount.toString();

    return amountStr.includes('.') ? amountStr : amountStr + '.00';
}

/**
 * Validates a phone number and returns formatted object
 * @param {Object} messages Messages
 * @param {string} pageFlow Page flow
 * @param {Object|undefined} shippingAddress Shipping address data from the Google Pay
 * @returns {Object} Formatted phone number object
 */
const validateAndFormatPhoneNumber = (messages, pageFlow, shippingAddress) => {
    if (window.paypalPreferences.isDigitalGoodsFlowEnabled) {
        return null;
    }

    const phoneNumber = pageFlow === window.paypalConstants.PAGE_FLOW_BILLING
        ? document.querySelector('.shipping-phone').innerText
        : shippingAddress.phoneNumber;

    const phoneRegExp = /^[0-9]{1,14}?$/;
    const countryCodeRegExp = /^[0-9]{1,3}$/;

    const countryCode = phoneNumber.match(/\d+/)[0];
    const phone = phoneNumber.match(/\s(\d.+)/)?.[0].replace(/\D/g, '');
    const isPhoneValid = countryCodeRegExp.test(countryCode) && phoneRegExp.test(phone);

    if (!isPhoneValid && pageFlow !== window.paypalConstants.PAGE_FLOW_BILLING) {
        throw Object.assign(
            new Error(messages.PHONE_NUMBER_INVALID),
            { code: window.paypalConstants.GOOGLEPAY_PHONE_NUMBER_INVALID }
        );
    }

    return isPhoneValid ? {
        country_code: countryCode,
        national_number: phone
    } : null;
};

/**
 * Convert received payment data to GooglePay payment source
 * @param {Object} paymentData received payment data
 * @param {Object} messages Messages
 * @param {string} pageFlow Page flow
 * @return {Object} GooglePay payment source
 */
function getGooglePayPaymentSourceFromPaymentData(paymentData, messages, pageFlow) {
    const billingAddress = paymentData.paymentMethodData.info.billingAddress;
    const paymentSource = {
        google_pay: {
            name: billingAddress.name,
            email_address: paymentData.email,
            card: paymentData.paymentMethodData.info
        }
    };

    const formattedPhoneNumber = validateAndFormatPhoneNumber(messages, pageFlow, paymentData.shippingAddress);

    if (formattedPhoneNumber) {
        paymentSource.phone_number = formattedPhoneNumber;
    }

    return paymentSource;
}

/**
 * Create and return GooglePay create payment data request
 * @param {Object} totalPrice updated amount value
 * @param {Array} allowedPaymentMethods received allowed payment methods
 * @param {Object} paymentDataRequest base GooglePay request
 * @return {Object} GooglePay create payment data request
 */
function getPaymentDataRequest(totalPrice, allowedPaymentMethods, paymentDataRequest) {
    // Update card payment methods to require billing address
    const cardPaymentMethod = allowedPaymentMethods[0];

    cardPaymentMethod.parameters.billingAddressRequired = true;
    cardPaymentMethod.parameters.billingAddressParameters = {
        format: 'FULL',
        phoneNumberRequired: true
    };

    const requestObject = {
        callbackIntents: ['PAYMENT_AUTHORIZATION'],
        merchantInfo: {
            merchantName: window.paypalPreferences.merchantName
        },
        allowedPaymentMethods: allowedPaymentMethods,
        emailRequired: true,
        transactionInfo: {
            currencyCode: totalPrice.currencyCode,
            totalPriceStatus: 'FINAL',
            totalPrice: getConvertedAmountToCostString(totalPrice.amount)
        }
    };

    return Object.assign(paymentDataRequest, requestObject);
}

/**
 * The function calls StreamlinedCheckout route and redirects the user to the place order stage.
 * @param {Object} paymentData payment data object
 * @param {string} pageFlow page flow
 */
function streamlinedCheckout(paymentData, pageFlow) {
    const api = require('../helpers/api');

    const AlertHandlerModel = require('../models/alertHandler');
    const alertHandler = new AlertHandlerModel();

    const googlePayButtonEl = document.querySelector('.js-paypal-googlepay-button');
    const continueButtonEl = document.querySelector('button.submit-payment');

    const cartFormData = api.createCartBillingFormData({
        googlePayEmailAddress: paymentData.email,
        googlePayBillingAddressAsString: JSON.stringify(paymentData.paymentMethodData.info.billingAddress),
        googlePayShippingAddressAsString: JSON.stringify(paymentData.shippingAddress),
        usedPaymentMethod: window.paypalConstants.PAYMENT_METHOD_ID_GOOGLE_PAY,
        paymentMethod: window.paypalConstants.PAYMENT_METHOD_ID_PAYPAL
    }, googlePayButtonEl);

    fetch(helper.getUrlWithCsrfToken(window.paypalUrls.streamlinedCheckout), {
        method: 'POST',
        body: cartFormData
    })
        .then((response) => {
            if (response.status === 500) {
                return response.text();
            }

            return response.json();
        })
        .then((data) => {
            if (typeof data === 'string') {
                alertHandler.showError(data);
                helper.setInitialShippingOption();

                if ([window.paypalConstants.PAGE_FLOW_PVP, window.paypalConstants.PAGE_FLOW_PDP].includes(pageFlow)) {
                    helper.removeAllProductsFromCart();
                }

                return;
            }

            helper.streamlinedCheckoutRedirect(data);
            continueButtonEl?.click();
            this.loader.hide();
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Proceed to next payment step with Google Pay
 * @param {Object} paymentData payment data for billing form
 */
function proceedGooglePayCheckout(paymentData) {
    helper.updateBillingAddressForDigitalGoodsFlow();

    document.getElementById('googlepay-email-address').value = paymentData.email;
    document.getElementById('googlepay-billing-address-as-string').value
        = JSON.stringify(paymentData.paymentMethodData.info.billingAddress);

    const continueButtonEl = document.querySelector('button.submit-payment');

    continueButtonEl.click();
}

/**
 * Proceed order placing
 * @param {Object} confirmOrderResponse confirm order response
 * @param {Object} paymentData payment data
 * @param {string} [pageFlow] current page flow
 */
function proceedOrderPlacing(confirmOrderResponse, paymentData, pageFlow = window.paypalConstants.PAGE_FLOW_BILLING) {
    if (confirmOrderResponse.status === window.paypalConstants.GOOGLE_PAY_ORDER_STATUS_PAYER_ACTION_REQUIRED) {
        this.googlePayInstance.initiatePayerAction({ orderId: confirmOrderResponse.id })
            .then(() => {
                this.loader.hide();

                pageFlow === window.paypalConstants.PAGE_FLOW_BILLING
                    ? proceedGooglePayCheckout(paymentData)
                    : streamlinedCheckout(paymentData, pageFlow);
            });
    } else if (confirmOrderResponse.status === window.paypalConstants.GOOGLE_PAY_ORDER_STATUS_APPROVED) {
        this.loader.hide();

        pageFlow === window.paypalConstants.PAGE_FLOW_BILLING
            ? proceedGooglePayCheckout(paymentData)
            : streamlinedCheckout(paymentData, pageFlow);
    } else {
        if ([window.paypalConstants.PAGE_FLOW_PDP, window.paypalConstants.PAGE_FLOW_PVP].includes(pageFlow)) {
            helper.removeAllProductsFromCart();
        }

        this.alertHandler.showError(window.i18nMessages.INTERNAL_SERVER_ERROR);
    }
}

/**
 * Handles an error from the Google pay on the express checkout pages
 * Should be called with the specific 'this' context
 * @param {Object} error Error object
 */
function handleExpressCheckoutError(error) {
    this.loader.hide();

    helper.setInitialShippingOption();

    const errorMessage = helper.getErrorMessage(error);

    if (error?.code !== window.paypalConstants.POPUP_GOOGLE_PAY_CLOSE_DETECT_CODE) {
        this.alertHandler.showError(errorMessage);
    }
}

module.exports = {
    getBaseGooglePayRequest,
    getPaymentDataRequest,
    getConvertedAmountToCostString,
    getGooglePayPaymentSourceFromPaymentData,
    proceedGooglePayCheckout,
    proceedOrderPlacing,
    handleExpressCheckoutError
};
