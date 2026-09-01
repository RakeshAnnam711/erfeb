'use strict';

const constants = require('*/cartridge/config/constants');

/**
 * Returns a contact preference (NO_CONTACT_INFO, UPDATE_CONTACT_INFO, RETAIN_CONTACT_INFO)
 * @param {Object|undefined} shippingData Shipping data object from the purchase unit
 * @param {boolean} isExpressCheckout Indicates whether express checkout is used or not
 * @param {boolean} isDigitalGoodsEnabled Indicates whether the digital goods flow is enabled or not
 * @returns {string} A contact preference
 */
function getContactPreference(shippingData, isExpressCheckout, isDigitalGoodsEnabled) {
    let contactPreference = '';

    if (isDigitalGoodsEnabled) {
        return constants.CONTACT_PREFERENCE_NO_CONTACT_INFO;
    }

    if (isExpressCheckout) {
        contactPreference = customer.authenticated && customer.registered
            ? constants.CONTACT_PREFERENCE_RETAIN_CONTACT_INFO
            : constants.CONTACT_PREFERENCE_UPDATE_CONTACT_INFO;
    } else {
        contactPreference = shippingData && shippingData.phone_number
            ? constants.CONTACT_PREFERENCE_RETAIN_CONTACT_INFO
            : constants.CONTACT_PREFERENCE_NO_CONTACT_INFO;
    }

    return contactPreference;
}

/**
 * Sets URLs and app switch preference in PayPal experience context
 * @param {Object} experienceContext - Object to be enriched with return_url, cancel_url, and app_switch_preference
 * @param {boolean} appSwitchEnabled - Whether the PayPal app switch is enabled
 */
function prepareAppSwitchContext(experienceContext, appSwitchEnabled) {
    if (!appSwitchEnabled) {
        return;
    }

    const URLUtils = require('dw/web/URLUtils');
    const StringUtils = require('dw/util/StringUtils');

    const urls = require('~/cartridge/config/urls');
    const utils = require('~/cartridge/scripts/paypal/utils');

    const hm = request.httpParameterMap;
    const pid = hm.pid.stringValue;
    const currentPage = hm.currentPage.stringValue;
    const userAgent = StringUtils.encodeBase64(utils.getUserAgent());

    let url = request.httpReferer;

    if (currentPage === constants.PAGE_FLOW_MINICART) {
        url = urls.cartPage;
    } else if (pid && ![
        constants.PAGE_FLOW_PRODUCT,
        constants.PAGE_FLOW_CART,
        constants.PAGE_FLOW_CATEGORY
    ].includes(currentPage)) {
        url = URLUtils.https('Product-Show', 'pid', pid).toString();
    }

    const delimiter = url.includes('?') ? '&' : '?';

    url = [url, 'uaRef=' + encodeURIComponent(utils.reverseString(userAgent))].join(delimiter);

    Object.assign(experienceContext, {
        return_url: url,
        cancel_url: url,
        app_switch_preference: {
            launch_paypal_app: appSwitchEnabled
        }
    });
}

/**
 * Updates or adds PayPal payment source data fields
 * @param {Object} params Parameters for processing the payment source data
 * @param {Object} params.paymentSourceData PayPal Payment source object
 * @param {boolean} params.isExpressCheckout Indicates whether express checkout is used or not
 * @param {Object|undefined} params.shippingData Shipping data object from the purchase unit
 * @param {boolean} params.isDigitalGoodsEnabled Indicates whether the digital goods flow is enabled or not
 * @param {boolean} params.isStreamlinedCheckout Indicates whether the streamlined checkout flow is enabled or not
 * @param {dw.order.LineItemCtnr} params.lineItemCtnr Current LineItemCtnr
 * @param {boolean} params.appSwitchEnabled Indicates whether the appSwitchEnabled is enabled or not
 */
function processPaypalPaymentSourceData(params) {
    const paymentSourceHelper = require('~/cartridge/scripts/paypal/helpers/paymentSource');

    const {
        paymentSourceData,
        isExpressCheckout,
        shippingData,
        isDigitalGoodsEnabled,
        isStreamlinedCheckout,
        lineItemCtnr,
        appSwitchEnabled
    } = params;

    if (!paymentSourceData.paypal) {
        return;
    }

    if (paymentSourceData.paypal.vault_id) {
        return;
    }

    paymentSourceData.paypal.experience_context.user_action = isStreamlinedCheckout
        ? constants.USER_ACTION_PAY_NOW
        : constants.USER_ACTION_CONTINUE;

    paymentSourceData.paypal.experience_context.contact_preference = getContactPreference(
        shippingData, isExpressCheckout, isDigitalGoodsEnabled
    );

    paymentSourceData.paypal.experience_context.shipping_preference = paymentSourceHelper.getShippingPreference(
        lineItemCtnr, isExpressCheckout, isDigitalGoodsEnabled
    );

    paymentSourceHelper.processOrderUpdateCallbackConfig(params);

    prepareAppSwitchContext(paymentSourceData.paypal.experience_context, appSwitchEnabled);
}

/**
 * Returns contact phone and email information
 * @param {dw.order.Basket} basket - Current user's basket
 * @param {boolean} isExpressCheckout If the express checkout is used or not
 * @returns {Object} The Contact information email and phone number
 */
function getContactInfo(basket, isExpressCheckout) {
    const phoneNumber = basket.defaultShipment.shippingAddress && basket.defaultShipment.shippingAddress.phone;
    const isCustomerAuthenticated = customer.authenticated && customer.registered;

    return {
        phoneNumber: isCustomerAuthenticated && isExpressCheckout ? null : phoneNumber,
        email: isCustomerAuthenticated ? customer.profile.email : basket.customerEmail
    };
}

/**
 * Adds the contact info (email, phone number) to the PayPal in case if exist
 * @param {Object} params - The parameters to handle contact info
 * @param {dw.order.Basket} params.currentBasket - Current user's basket
 * @param {Object} params.purchaseUnit - purchase unit object
 * @param {boolean} params.isDigitalGoodsFlowEnabled Indicates whether the digital goods flow is enabled or not
 * @param {boolean} params.isExpressCheckout If the express checkout is used or not
 */
function addContactInfoToPurchaseUnit(params) {
    const { currentBasket, purchaseUnit, isDigitalGoodsFlowEnabled, isExpressCheckout } = params;

    if (isDigitalGoodsFlowEnabled) {
        return;
    }

    const contactInfo = getContactInfo(currentBasket, isExpressCheckout);
    const countryCodeMatch = contactInfo.phoneNumber && contactInfo.phoneNumber.match(/^\+\d{1,3}/);

    if (!purchaseUnit.shipping && (contactInfo.email || countryCodeMatch)) {
        purchaseUnit.shipping = {};
    }

    if (contactInfo.email) {
        purchaseUnit.shipping.email_address = contactInfo.email;
    }

    if (countryCodeMatch) {
        const NATIONAL_NUMBER_LENGTH = 10;
        const PHONE_REGEX_SLICE_START = 1;

        const fullCountryCode = countryCodeMatch[0].slice(PHONE_REGEX_SLICE_START);
        const nationalNumber = contactInfo.phoneNumber
            .slice(countryCodeMatch[0].length)
            .replace(/\s+/g, '');

        const isShortNumber = nationalNumber.length < NATIONAL_NUMBER_LENGTH;
        const availableDigitsQuantity = isShortNumber
            ? Math.min(NATIONAL_NUMBER_LENGTH - nationalNumber.length, fullCountryCode.length)
            : 0;

        purchaseUnit.shipping.phone_number = {
            country_code: isShortNumber ? fullCountryCode.slice(0, -availableDigitsQuantity) : fullCountryCode,
            national_number: isShortNumber
                ? fullCountryCode.slice(-availableDigitsQuantity) + nationalNumber
                : nationalNumber.slice(0, NATIONAL_NUMBER_LENGTH)
        };
    }
}

module.exports = {
    prepareAppSwitchContext: prepareAppSwitchContext,
    addContactInfoToPurchaseUnit: addContactInfoToPurchaseUnit,
    processPaypalPaymentSourceData: processPaypalPaymentSourceData
};
