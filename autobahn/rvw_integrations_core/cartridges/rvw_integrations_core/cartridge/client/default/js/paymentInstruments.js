'use strict';

var corePaymentInstruments = require('core/paymentInstruments');
corePaymentInstruments.baseFiles.paymentInstruments = require('./paymentInstruments/paymentInstruments');

var siteIntegrations = require('./integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();

var paymentInstrumentExtensions = [];
if(toggleObject.cybersourceCartridgeEnabled) {
    paymentInstrumentExtensions.push(require('./integrations/cybersource/paymentInstruments'));
}

paymentInstrumentExtensions.forEach(function (library) {
    Object.keys(library).forEach(function (key) {
        if (typeof library[key] === 'object') {
            corePaymentInstruments.baseFiles[key] = $.extend({}, corePaymentInstruments.baseFiles[key], library[key]);
        } else {
            corePaymentInstruments.baseFiles[key] = library[key];
        }
    });
});


module.exports = corePaymentInstruments;
