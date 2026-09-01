'use strict';

const currentSite = require('dw/system/Site').current;

const allowedCurrencies = [
    'AUD',
    'BRL',
    'CAD',
    'CHF',
    'CZK',
    'DKK',
    'EUR',
    'HKD',
    'HUF',
    'INR',
    'ILS',
    'JPY',
    'MYR',
    'MXN',
    'TWD',
    'NZD',
    'NOK',
    'PHP',
    'PLN',
    'GBP',
    'RUB',
    'SGD',
    'SEK',
    'THB',
    'USD'
];

const disableFunds = [
    'sepa',
    'bancontact',
    'eps',
    'ideal',
    'mybank',
    'p24',
    'blik',
    'trustly',
    'multibanco'
];

const paypalFraudNetScriptLink = 'https://c.paypal.com/da/r/fb.js';
const payPalExternalApiSdk = 'https://www.paypalobjects.com/js/external/api.js';

const smartButtonStyles = JSON.parse(currentSite.getCustomPreferenceValue('PP_Smart_Button_Styles'));
const cwppButtonStyles = JSON.parse(currentSite.getCustomPreferenceValue('PP_CWPP_Button_Styles'));
const applePayButtonStyles = JSON.parse(currentSite.getCustomPreferenceValue('PP_AP_API_Button_Styles'));
const cardFieldsStyles = JSON.parse(currentSite.getCustomPreferenceValue('PP_Card_Fields_Styles'));
const buttonMessageStyles = JSON.parse(currentSite.getCustomPreferenceValue('PP_Button_Message_Styles'));

module.exports = {
    disableFunds: disableFunds,
    paypalFraudNetScriptLink: paypalFraudNetScriptLink,
    allowedCurrencies: allowedCurrencies,
    paypalBillingButtonConfig: { style: smartButtonStyles.billing },
    paypalCartButtonConfig: { style: smartButtonStyles.cart },
    paypalPdpButtonConfig: { style: smartButtonStyles.pdp },
    paypalPvpButtonConfig: { style: smartButtonStyles.pvp },
    paypalMinicartButtonConfig: { style: smartButtonStyles.minicart },
    cwppButtonStyles: cwppButtonStyles,
    payPalExternalApiSdk: payPalExternalApiSdk,
    cwppScopes: 'openid profile email address',
    cardFieldsStyles: cardFieldsStyles,
    applePayButtonConfig: applePayButtonStyles,
    buttonMessageConfig: buttonMessageStyles,
    applePaySdk: 'https://applepay.cdn-apple.com/jsapi/v1/apple-pay-sdk.js',
    googlePaySdk: 'https://pay.google.com/gp/p/js/pay.js'
};
