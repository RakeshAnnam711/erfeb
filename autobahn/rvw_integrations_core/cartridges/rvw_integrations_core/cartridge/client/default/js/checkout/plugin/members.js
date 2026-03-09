'use strict';

var siteIntegrations = require('../../integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();

var coreMembers = require('core/checkout/plugin/members');
var membersExtensions = [];

if (toggleObject.sfcommercepaymentsCartridgeEnabled) {
    membersExtensions.push(require('../../integrations/commercepayments/checkout/plugin/members'));
}

if (toggleObject.adyenCartridgeEnabled) {
    membersExtensions.push(require('../../integrations/adyen/checkout/plugin/members'));
}

membersExtensions.forEach(function (library) {
    Object.keys(library).forEach(function (item) {
        if (typeof library[item] === 'object') {
            coreMembers[item] = $.extend({}, coreMembers[item], library[item]);
        } else {
            coreMembers[item] = library[item];
        }
    });
});

module.exports = coreMembers;
