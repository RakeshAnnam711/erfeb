'use strict';

var coreLogin = require('core/login');

var siteIntegrations = require('./integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();

if (toggleObject.enablePasswordlessLogin) {
    coreLogin.baseFiles.passwordlesslogin = require('./integrations/passwordlessLogin/login');
}

module.exports = coreLogin;
