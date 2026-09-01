'use strict';

const payPalHelper = require('~/cartridge/scripts/paypal/helpers/paypalHelper');

/**
 * Returns the shipping preference to be passed to the payment source
 * @param {dw.order.Basket} basket - Current basket
 * @param {boolean} isExpressCheckout Whether express checkout is used
 * @param {boolean} isDigitalGoodsEnabled Whether is digital goods is used
 * @returns {string} Shipping preference: 'NO_SHIPPING', 'SET_PROVIDED_ADDRESS', 'GET_FROM_FILE'
 */
function getShippingPreference(basket, isExpressCheckout, isDigitalGoodsEnabled) {
    const constants = require('~/cartridge/config/constants');

    const isReturningCustomerEnabled = payPalHelper.isReturningCustomerExperienceEnabled(isExpressCheckout);
    const isNoShipping = (basket.productLineItems.empty && !basket.giftCertificateLineItems.empty) || isDigitalGoodsEnabled;
    const isSetProvidedAddress = isReturningCustomerEnabled || !isExpressCheckout;

    let shippingPreference = null;

    if (isNoShipping) {
        shippingPreference = constants.SHIPPING_PREFERENCE_NO_SHIPPING;
    } else if (isSetProvidedAddress) {
        shippingPreference = constants.SHIPPING_PREFERENCE_SET_PROVIDED_ADDRESS;
    } else {
        shippingPreference = constants.SHIPPING_PREFERENCE_GET_FROM_FILE;
    }

    return shippingPreference;
}

/**
 * Indicates whether to add the shipping callback to the order create request or not
 * @param {boolean} isExpressCheckout Indicates whether express checkout is used or not
 * @param {boolean} isDigitalGoodsEnabled Indicates whether the digital goods flow is enabled or not
 * @returns {boolean} Whether to add shipping callback to the order create request or not
 */
function isShippingCallback(isExpressCheckout, isDigitalGoodsEnabled) {
    return isExpressCheckout && !isDigitalGoodsEnabled && !payPalHelper.isReturningCustomerExperienceEnabled(isExpressCheckout);
}

/**
 * Returns the dwsecuretoken cookie or undefined if no cookie found
 * @returns {dw.web.Cookie|undefined} The dwsecuretoken cookie or undefined if no cookie found
 */
function getDwSecurityToken() {
    return Object.values(request.httpCookies).find(function(cookie) {
        const isToken = cookie.name.includes('dwsecuretoken');

        if (isToken) {
            const dwanonymousName = ['dwanonymous_', cookie.name.split('_').pop()].join('');
            const dwanonymous = request.httpCookies[dwanonymousName];

            return Boolean(dwanonymous);
        }

        return isToken;
    });
}

/**
 * Returns shipping callback url with query strings
 * @param {string} basketId Current basket id
 * @returns {string} Url
 */
function getShippingCallbackUrl(basketId) {
    const URLUtils = require('dw/web/URLUtils');

    const constants = require('~/cartridge/config/constants');

    const sessionId = request.httpCookies[constants.DWSID].value;
    const dwsecuretoken = getDwSecurityToken();

    const redirectUrl = URLUtils.https('Paypal-ShippingCallback', 'cart_id', basketId, 'session_id', sessionId);

    if (dwsecuretoken) {
        redirectUrl.append('token_data', JSON.stringify({
            name: dwsecuretoken.name,
            value: dwsecuretoken.value
        }));
    }

    return redirectUrl.toString();
}

/**
 * Updates the payment source data with the order_update_callback_config based on the conditions
 * @param {Object} params Additional parameters for processing the callback config
 * @param {Object} params.paymentSourceData - data from payment source object
 * @param {boolean} params.isExpressCheckout - Flag indicating whether the express checkout is used
 * @param {boolean} params.isDigitalGoodsEnabled Whether is digital goods is used
 * @param {Object} params.lineItemCtnr - The line item container basket/order
 */
function processOrderUpdateCallbackConfig(params) {
    const {
        paymentSourceData,
        isExpressCheckout,
        isDigitalGoodsEnabled,
        lineItemCtnr
    } = params;

    if (isShippingCallback(isExpressCheckout, isDigitalGoodsEnabled)) {
        paymentSourceData[Object.keys(paymentSourceData)[0]].experience_context.order_update_callback_config = {
            callback_events: ['SHIPPING_ADDRESS', 'SHIPPING_OPTIONS'],
            callback_url: getShippingCallbackUrl(lineItemCtnr.UUID)
        };
    }
}

/**
 * Updates or adds Venmo payment source data fields
 * @param {Object} params Additional parameters for processing the Venmo source data
 * @param {Object} params.paymentSourceData - data from payment source object
 * @param {boolean} params.isExpressCheckout - Flag indicating whether the express checkout is used
 * @param {Object} params.lineItemCtnr - The line item container basket/order
 * @param {boolean} params.isDigitalGoodsEnabled Whether is digital goods is used
 * @returns {void}
 */
function processVenmoPaymentSourceData(params) {
    const {
        paymentSourceData,
        isExpressCheckout,
        lineItemCtnr,
        isDigitalGoodsEnabled
    } = params;

    if (!paymentSourceData.venmo) {
        return;
    }

    paymentSourceData.venmo.experience_context.shipping_preference = getShippingPreference(
        lineItemCtnr, isExpressCheckout, isDigitalGoodsEnabled
    );

    processOrderUpdateCallbackConfig(params);
}

/**
 * Updates payment source data
 * @param {Object} paymentSourceData - data from payment source object
 * @param {Object} orderData - order data
 * @param {Object} params - Additional parameters for processing the payment source data
 * @param {Object} params.lineItemCtnr - The line item container basket/order
 * @param {boolean} params.isExpressCheckout - Flag indicating whether the express checkout is used
 * @param {boolean} params.isDigitalGoodsEnabled Whether is digital goods is used
 * @param {boolean} params.isStreamlinedCheckout Indicates whether the streamlined checkout flow is enabled or not
 * @param {boolean} params.appSwitchEnabled Indicates whether the appSwitchEnabled is enabled or not
 */
function updatePaymentSourceData(paymentSourceData, orderData, params) {
    const paymentSourcePaypalHelper = require('*/cartridge/scripts/paypal/helpers/paymentSourcePaypal');

    const { lineItemCtnr, isExpressCheckout, isDigitalGoodsEnabled, isStreamlinedCheckout, appSwitchEnabled } = params;

    if (paymentSourceData.card && !paymentSourceData.card.single_use_token) {
        const creditCardHelper = require('*/cartridge/scripts/paypal/helpers/creditCardHelper');

        paymentSourceData = creditCardHelper.processCardData(lineItemCtnr, orderData, paymentSourceData);
    }

    if (paymentSourceData.google_pay) {
        const googlePayHelper = require('*/cartridge/scripts/paypal/helpers/googlePayHelper');

        paymentSourceData = googlePayHelper.processGooglePayData(paymentSourceData);
    }

    paymentSourcePaypalHelper.processPaypalPaymentSourceData({
        paymentSourceData: paymentSourceData,
        isExpressCheckout: isExpressCheckout,
        shippingData: orderData.body.purchase_units[0].shipping,
        isDigitalGoodsEnabled: isDigitalGoodsEnabled,
        isStreamlinedCheckout: isStreamlinedCheckout,
        lineItemCtnr: lineItemCtnr,
        appSwitchEnabled: appSwitchEnabled
    });

    processVenmoPaymentSourceData({
        paymentSourceData: paymentSourceData,
        isExpressCheckout: isExpressCheckout,
        lineItemCtnr: lineItemCtnr,
        isDigitalGoodsEnabled: isDigitalGoodsEnabled
    });

    orderData.body.payment_source = paymentSourceData;
}

module.exports = {
    getShippingPreference: getShippingPreference,
    isShippingCallback: isShippingCallback,
    getDwSecurityToken: getDwSecurityToken,
    getShippingCallbackUrl: getShippingCallbackUrl,
    processVenmoPaymentSourceData: processVenmoPaymentSourceData,
    processOrderUpdateCallbackConfig: processOrderUpdateCallbackConfig,
    updatePaymentSourceData: updatePaymentSourceData
};
