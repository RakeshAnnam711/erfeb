'use strict';
/**
 * This JS file merges together multiple integrations together
 *
 */
var siteIntegrations = require('../integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();

// grab the core
var corePaymentInstruments = require('core/paymentInstruments/paymentInstruments');
var paymentInstrumentsExtensions = [];

if (toggleObject.sfcommercepaymentsCartridgeEnabled) {
    paymentInstrumentsExtensions.push(require('../integrations/commercepayments/paymentInstruments/paymentInstruments'));
}

if(toggleObject.cybersourceCartridgeEnabled) {
    paymentInstrumentsExtensions.push(require ('../integrations/cybersource/paymentInstruments/paymentInstruments'));
}

paymentInstrumentsExtensions.forEach(function (library) {
    Object.keys(library).forEach(function (item) {
        if (typeof library[item] === 'object') {
            corePaymentInstruments[item] = $.extend({}, corePaymentInstruments[item], library[item]);
        } else {
            corePaymentInstruments[item] = library[item];
        }
    });
});

module.exports = corePaymentInstruments;