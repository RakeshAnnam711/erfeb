'use strict';

const paypalUtils = require('*/cartridge/scripts/paypal/utils');
const prefs = require('*/cartridge/config/preferences');
const sdkConfig = require('*/cartridge/config/sdkConfig');

const PAYPAL_SDK_LINK = 'https://www.paypal.com/sdk/js?client-id=';
const lpmsList = sdkConfig.disableFunds;

const FUNDING_PREFS = [
    { name: 'debitCreditButtonEnabled', value: prefs.debitCreditButtonEnabled || prefs.isCreditCardActive },
    { name: 'paypalPayLaterButtonEnabled', value: prefs.paypalPayLaterButtonEnabled },
    { name: 'venmoEnabled', value: prefs.isVenmoEnabled }
];

const FUNDING_SOURCES = {
    debitCreditButtonEnabled: 'card',
    paypalPayLaterButtonEnabled: 'paylater',
    venmoEnabled: 'venmo'
};

/**
 * Determine if current currency supported by PP SDK
 * @param  {Array} allowedCurrenciesFromPP Allowed currencies for PP SDK
 * @param  {string} storeCurrency Current session currency
 * @returns {boolean} Currency match state
 */
function isAllowedCurrency(allowedCurrenciesFromPP, storeCurrency) {
    return allowedCurrenciesFromPP.some(function(allowedCurrency) {
        return allowedCurrency === storeCurrency;
    });
}

/**
 * Gets the disabled funding sources
 * @returns {array} of disabled funding sources
 */
function disabledPaymentOptions() {
    FUNDING_PREFS.forEach(function(fundingPref) {
        if (!fundingPref.value && !sdkConfig.disableFunds.includes(FUNDING_SOURCES[fundingPref.name])) {
            sdkConfig.disableFunds.push(FUNDING_SOURCES[fundingPref.name]);
        }
    });

    if (empty(prefs.enabledLPMs)) {
        return sdkConfig.disableFunds;
    }

    const lpmMethods = prefs.enabledLPMs.map(function(lpm) {
        return lpm.toLowerCase();
    });

    sdkConfig.disableFunds = sdkConfig.disableFunds.filter(function(fund) {
        return lpmMethods.indexOf(fund) === -1;
    });

    return sdkConfig.disableFunds;
}

/**
 * Returns enable funding part of the SDK URL
 * @param  {string} url Current SDK URL
 * @param  {Array} customEnableFundingList Additional currencies for enable-funding PP SDK
 * @returns {string} URL SDK with the necessary values in the part of enable-funding
 */
function addEnableFundingParam(url, customEnableFundingList) {
    const enableFundingKey = '&enable-funding=';

    let customEnableFundingArray;

    if (!empty(customEnableFundingList)) {
        customEnableFundingArray = customEnableFundingList.slice(0);
    } else {
        customEnableFundingArray = [];
    }

    FUNDING_PREFS.forEach(function(fundingPref) {
        if (fundingPref.value) {
            customEnableFundingArray.push(FUNDING_SOURCES[fundingPref.name]);
        }
    });

    if (!empty(customEnableFundingArray)) {
        return url + enableFundingKey + customEnableFundingArray.join(',');
    }

    return url;
}

/**
 * Returns disable funding part of the SDK URL
 * @param  {string} url Current SDK URL
 * @param  {Array} customDisableFundingList Additional currencies for disable-funding PP SDK
 * @returns {string} URL SDK with the necessary values in the part of disable-funding
 */
function addDisableFundingParam(url, customDisableFundingList) {
    const disableFundingKey = '&disable-funding=';
    const customDisableFundingArray = disabledPaymentOptions();

    if (!empty(customDisableFundingList)) {
        customDisableFundingList.forEach(function(element) {
            customDisableFundingArray.push(element);
        });
    }

    return url + disableFundingKey + customDisableFundingArray.join(',');
}

/**
 * Creates SDK url for paypal button on cart page based on payment action and client id
 * @returns {string} created url
 */
function createCartSDKUrl() {
    const clientID = paypalUtils.getClientId();
    const currentCurrencyCode = session.currency.currencyCode;
    // Excludes LPM's from enable funding list
    const disabledLpms = lpmsList.filter(function(lpmName) {
        return prefs.enableFundingList.includes(lpmName);
    });

    const enableFunding = prefs.enableFundingList.filter(function(ef) {
        return !disabledLpms.includes(ef);
    });

    const components = '&components=applepay,googlepay,buttons,messages,funding-eligibility';

    let sdkUrl = [PAYPAL_SDK_LINK, clientID, '&commit=' + prefs.isStreamlinedCheckout, components].join('');

    if (prefs.isCreditCardActive) {
        FUNDING_PREFS[0].value = false;
    }

    if (!prefs.isCapture) {
        sdkUrl += '&intent=authorize';
    }

    if (isAllowedCurrency(sdkConfig.allowedCurrencies, currentCurrencyCode)) {
        sdkUrl += '&currency=' + currentCurrencyCode;
    }

    sdkUrl = addEnableFundingParam(sdkUrl, enableFunding);
    sdkUrl = addDisableFundingParam(sdkUrl, prefs.disableFundingList);

    return sdkUrl;
}

/**
 * Creates SDK urls for paypal button on billing page based on payment action and client id
 * @returns {Object} created urls
 */
function createBillingSDKUrls() {
    const dwSystem = require('dw/system/System');
    const clientID = paypalUtils.getClientId();
    const currentCurrencyCode = session.currency.currencyCode;
    const isActiveLPM = !empty(prefs.enabledLPMs);
    const isStreamlinedCheckout = prefs.isStreamlinedCheckout || isActiveLPM;

    let lpmSdk = null;
    let components = '&components=applepay,googlepay,buttons,messages,marks,payment-fields,funding-eligibility';

    if (prefs.isCreditCardActive) {
        components += ',card-fields';
    }

    if (prefs.isFastlaneEnabled) {
        components += ',fastlane';

        if (prefs.isThreeDSecureEnabled) {
            components += ',three-domain-secure';
        }
    }

    let sdkUrl = [PAYPAL_SDK_LINK, clientID, components].join('');

    if (isAllowedCurrency(sdkConfig.allowedCurrencies, currentCurrencyCode)) {
        sdkUrl += '&currency=' + currentCurrencyCode;
    }

    sdkUrl = addEnableFundingParam(sdkUrl, prefs.enableFundingList);
    sdkUrl = addDisableFundingParam(sdkUrl, prefs.disableFundingList);

    sdkUrl += '&commit=' + isStreamlinedCheckout;

    // Only for LPM testing purposes
    if (dwSystem.DEVELOPMENT_SYSTEM === dwSystem.instanceType && currentCurrencyCode !== 'USD') {
        sdkUrl += ['&buyer-country=', request.locale.split('_')[1]].join('');
    }

    if (isActiveLPM) {
        lpmSdk = sdkUrl;
    }

    if (!prefs.isCapture) {
        sdkUrl += '&intent=authorize';
    }

    return {
        baseSdkUrl: sdkUrl,
        lpmSdk: lpmSdk
    };
}

/**
 * Creates SDK url for paypal button on account page for vaulting based on client id
 * @returns {string} created url
 */
function createAccountSDKUrl() {
    const clientID = paypalUtils.getClientId();

    return [PAYPAL_SDK_LINK, clientID, '&commit=false&disable-funding=card,credit'].join('');
}

/**
 * Creates url for paypal fraudNet noscript
 * @param  {string} fraudNetUID fraudNet UID
 * @returns {string} created url
 */
function createFraudNetNoScriptURL(fraudNetUID) {
    return ['https://c.paypal.com/v1/r/d/b/ns?f=', fraudNetUID, '&js=0&r=1'].join('');
}

module.exports = {
    accountSDKUrl: createAccountSDKUrl(),
    billingSdkUrl: createBillingSDKUrls(),
    cartSdkUrl: createCartSDKUrl(),
    fraudNetNoScriptURL: createFraudNetNoScriptURL,
    applePaySDK: 'https://applepay.cdn-apple.com/jsapi/v1/apple-pay-sdk.js',
    googlePaySDK: 'https://pay.google.com/gp/p/js/pay.js'
};
