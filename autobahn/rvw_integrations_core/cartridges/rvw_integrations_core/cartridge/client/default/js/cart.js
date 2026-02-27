'use strict';

var core = require('core/cart');

var siteIntegrations = require('./integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();

if (toggleObject.bopisCartridgeEnabled) {
    core.baseFiles.instore = require('./integrations/bopis/cart/instore');
}

if (toggleObject.cybersourceCartridgeEnabled || toggleObject.adyenCartridgeEnabled) {
    core.baseFiles.applepay = require('./integrations/applepay');
}

if (toggleObject.cybersourceCartridgeEnabled) {
    core.baseFiles.cybersourceMinicart = require('./integrations/cybersource/components/miniCart');
}

//Standalone paypal does not have a toggle
core.baseFiles.paypalUtils = require('./integrations/paypal');


module.exports = core;

