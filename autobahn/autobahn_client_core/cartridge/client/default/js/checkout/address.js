'use strict';

var base = require('base/checkout/address');

var siteIntegrations = require('integrations/integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();

if(toggleObject.googlePlacesEnabled) {
    var googleAutoComplete = require('core/thirdParty/googleAutoComplete');
    base.initAutocomplete = googleAutoComplete.initAutocomplete;
} else {
    base.initAutocomplete = function() { /* no autocomplete configuration enabled */ };
}

module.exports = base;
