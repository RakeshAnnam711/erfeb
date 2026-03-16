'use strict';
// These preferences and options can be overwritten with cartridge inheritance

var Site = require('dw/system/Site');
var abConfigs = require('*/cartridge/scripts/helpers/abConfigsHelper').getABConfigs();
var base = module.superModule || {};
var clickStreamEnabled = session && session.clickStream && session.clickStream.enabled; // session.isTrackingAllowed() || ClickstreamHonorDNT
var currentSite = Site.getCurrent();

function getSitePreference(preferenceId) {
    return currentSite && currentSite.getCustomPreferenceValue(preferenceId);
}

base.maxOrderQty = abConfigs.quantityDropdownLimit || 10;
base.defaultPageSize = abConfigs.plpDefaultPageSize || 12;
base.plpBackButtonOn = !!clickStreamEnabled;
base.plpBackButtonLimit = 10;
base.minTermLength = parseInt(getSitePreference('headerSearchMinTermLength'), 10) || parseInt(abConfigs.headerSearchMinTermLength, 10) || 1;
base.maxSuggestions = parseInt(getSitePreference('headerSearchMaxSuggestions'), 10) || parseInt(abConfigs.headerSearchMaxSuggestions, 10) || 3;
base.imageSize = 'small';

module.exports = base;
