'use strict';

const URLUtils = require('dw/web/URLUtils');
const coreHelpers = require('~/cartridge/scripts/helpers/coreHelpers');

module.exports = {
    testServiceConnection: URLUtils.url('ConfigCheck-TestServiceConnection').appendCSRFTokenBM().toString(),
    selfCheck: URLUtils.url('ConfigCheck-SelfCheck').appendCSRFTokenBM().toString(),

    // button styles
    cwppConfigUrl: URLUtils.url('CWPPConfig-Start').toString(),
    applePaySDK: 'https://applepay.cdn-apple.com/jsapi/v1/apple-pay-sdk.js',
    googlePaySDK: 'https://pay.google.com/gp/p/js/pay.js',
    payPalSDK: 'https://www.paypal.com/sdk/js?client-id={0}&components=buttons,messages',
    payPalExternalSDK: 'https://www.paypalobjects.com/js/external/api.js',
    payLaterConfiguratorSdk: 'https://www.paypalobjects.com/merchant-library/merchant-configurator.js',
    newTransaction: coreHelpers.getInstanceType() === 'production'
        ? 'https://www.paypal.com/signin'
        : 'https://www.sandbox.paypal.com/signin'
};
