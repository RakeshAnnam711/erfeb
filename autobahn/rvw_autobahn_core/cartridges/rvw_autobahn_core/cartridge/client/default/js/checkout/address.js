'use strict';

var base = require('base/checkout/address');

var siteIntegrations = require('../integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();

if(toggleObject.googlePlacesEnabled) {
    var googleApi = require('../thirdParty/googleMaps');
    var googleAutoComplete = require('../thirdParty/googleAutoComplete');

    base.initAutocomplete = googleApi().then(googleAutoComplete.initAutocomplete);
} else {
    base.initAutocomplete = function() { /* no autocomplete configuration enabled */ };
}

module.exports = base;
