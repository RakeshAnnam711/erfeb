'use strict';

var core = require('core/productDetail');

var siteIntegrations = require('./integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();
var productExtensions = [];

if (toggleObject.cybersourceCartridgeEnabled || toggleObject.adyenCartridgeEnabled) {
    productExtensions.push({
        applepay: require('./integrations/applepay')
    });
}

if (toggleObject.sfcommercepaymentsCartridgeEnabled) {
    productExtensions.push({
        detail: require('./integrations/commercepayments/product/detail'),
        payments: require('./integrations/commercepayments/product/payments')
    });
}

if (toggleObject.bopisCartridgeEnabled) {
    productExtensions.push({
        bopis: require ('./integrations/bopis/productDetail')
    })
}

productExtensions.forEach(function (library) {
    Object.keys(library).forEach(function (item) {
        if (typeof library[item] === 'object') {
            core.baseFiles[item] = $.extend({}, core.baseFiles[item], library[item]);
        } else {
            core.baseFiles[item] = library[item];
        }
    });
});

module.exports = core;
