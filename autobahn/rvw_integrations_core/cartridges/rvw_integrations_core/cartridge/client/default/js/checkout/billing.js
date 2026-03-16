'use strict';
/**
 * This JS file merges together multiple integrations together
 *
 */
var siteIntegrations = require('../integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();

var addressHelpers = require('core/checkout/address');

// load in the integration specific JS files that modify functions

var coreBilling = require('core/checkout/billing');
var coreBillingMethodUpdateBillingInformation = coreBilling.methods.updateBillingInformation;
var billingExtensions = [];

// we want to bring in all the stuff from cybersource billing and shipping and add it to autobahnCheckout
// THEN merge in the BOPIS stuff as that is smaller.
if(toggleObject.bopisCartridgeEnabled) {
    billingExtensions.push(require('../integrations/bopis/checkout/billing'));
}
if(toggleObject.cybersourceCartridgeEnabled) {
    billingExtensions.push(require('../integrations/cybersource/checkout/billing'));
}
if(toggleObject.adyenCartridgeEnabled) {
    billingExtensions.push(require('../integrations/adyen/checkout/billing'));
}
if(toggleObject.sfcommercepaymentsCartridgeEnabled) {
    billingExtensions.push(require('../integrations/commercepayments/checkout/billing'));
}

billingExtensions.forEach(function (library) {
    Object.keys(library).forEach(function (key) {
        if (typeof library[key] === 'object') {
            coreBilling[key] = $.extend({}, coreBilling[key], library[key]);
        } else {
            coreBilling[key] = library[key];
        }
    });
});
/**
 * If a function is modified in more than one cartridge it has to be brought into this file so that there can be call outs for each
 * respective integration
 */

coreBilling.methods.updateBillingInformation = coreBillingMethodUpdateBillingInformation;

module.exports = coreBilling;
