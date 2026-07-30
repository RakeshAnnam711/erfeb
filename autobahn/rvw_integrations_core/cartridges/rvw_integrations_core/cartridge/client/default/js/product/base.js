'use strict';

// Grab the base in autobahn_core
var baseCore = require('core/product/base');

// grab the stuff from bopis
var detailBopis = require('../integrations/bopis/product/detail');

// grab the site pref integration object
var siteIntegrations = require('../integrations/siteIntegrationsUtils');

var toggleObject = siteIntegrations?.getIntegrationSettings();
var exportDetails = {};
if(toggleObject?.bopisCartridgeEnabled) {
    exportDetails = $.extend({}, baseCore, { availability: detailBopis.availability });
} else {
    // we aren't modifying baseCore
    exportDetails = baseCore;
}

module.exports = exportDetails;
