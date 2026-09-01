'use strict';

const customerHelper = {};

/**
 * Return specific payment method from customers payment methods list
 * @param {string} paymentMethodName Name of the payment method
 * @return {Array<Object>} Payment method from customers payment methods list
 */
customerHelper.getCustomerPaymentInstruments = function(paymentMethodName) {
    if (customer.authenticated) {
        return customer.profile.wallet.getPaymentInstruments(paymentMethodName).toArray();
    }

    return [];
};

/**
 * Returns paypal customer id from profile or from API response.
 * @param {Object} payload - The response from REST API.
 * @return {string} - The paypal customer id.
 */
customerHelper.getPaypalCustomerId = function(payload) {
    return customer.profile.custom.payPalCustomerId ? customer.profile.custom.payPalCustomerId : payload.customer.id;
};

/**
 * Returns customer profile retrieved by paypal customer id.
 * @param {string} paypalCustomerId - paypal customer id from payload.
 * @return {dw.Profile} - Profile.
 */
customerHelper.getCustomerProfile = function(paypalCustomerId) {
    const SystemObjectMgr = require('dw/object/SystemObjectMgr');

    const query = 'custom.payPalCustomerId = {0}';

    return SystemObjectMgr.querySystemObject('Profile', query, paypalCustomerId);
};

/**
 * Sets creditCardToken value to the token's list to recognize customer during VaultPaymentTokenDeletedWebHook
 * Saves in string format '*token1*token2*token3*'
 * @param {dw.profile.custom} profileCustom profile.custom
 * @param {string} creditCardToken payment token of credit card
 */
customerHelper.setPayPalSavedCardsPaymentToken = function(profileCustom, creditCardToken) {
    if (!profileCustom.payPalSavedCardsPaymentTokens) {
        profileCustom.payPalSavedCardsPaymentTokens = '*'.concat(creditCardToken, '*');
    } else {
        profileCustom.payPalSavedCardsPaymentTokens += creditCardToken.concat('*');
    }
};

/**
 * Remove saved payment token from the list, which is used during VaultPaymentTokenDeletedWebHook
 * @param {dw.profile.custom} profileCustom profile.custom
 * @param {string} creditCardToken payment token of credit card
 */
customerHelper.deletePayPalSavedCardsPaymentToken = function(profileCustom, creditCardToken) {
    if (profileCustom.payPalSavedCardsPaymentTokens) {
        profileCustom.payPalSavedCardsPaymentTokens = profileCustom.payPalSavedCardsPaymentTokens
            .replace(creditCardToken, '').replace('**', '*');
    }
};

module.exports = customerHelper;
