var checkoutAutobahn = require('core/checkout');
checkoutAutobahn.baseFiles.checkout = require('./checkout/checkout');

// grab the site pref integration object
var siteIntegrations = require('./integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();
if (toggleObject.bopisCartridgeEnabled) {
    checkoutAutobahn.baseFiles.instore = require('./integrations/bopis/checkout/instore');
    checkoutAutobahn.baseFiles.bopischeckout = require('./integrations/bopis/checkout/checkout');
}

if (toggleObject.cybersourceCartridgeEnabled || toggleObject.adyenCartridgeEnabled) {
    checkoutAutobahn.baseFiles.applepayUtils = require('./integrations/applepay');
}

if (toggleObject.cybersourceCartridgeEnabled) {
    checkoutAutobahn.baseFiles.shippingDAV = require('./integrations/cybersource/checkout/shippingDAV');
}

if (toggleObject.adyenCartridgeEnabled) {
    checkoutAutobahn.baseFiles.adyencheckout = require('./integrations/adyen/checkout/checkout');
}

if (toggleObject.klaviyo_enabled) {
    checkoutAutobahn.baseFiles.klaviyoCheckout = require('./integrations/klaviyo/checkout/checkout');
}

if (toggleObject.enablePasswordlessLogin) {
    checkoutAutobahn.baseFiles.passwordlesslogin = require('./integrations/passwordlessLogin/login');
}

module.exports = checkoutAutobahn;
