'use strict';
// These preferences and options can be overwritten with cartridge inheritance

var abConfigs = require('*/cartridge/scripts/helpers/abConfigsHelper').getABConfigs();
var base = module.superModule || {};
var clickStreamEnabled = session && session.clickStream && session.clickStream.enabled; // session.isTrackingAllowed() || ClickstreamHonorDNT

base.maxOrderQty = abConfigs.quantityDropdownLimit || 10;
base.defaultPageSize = abConfigs.plpDefaultPageSize || 12;
base.plpBackButtonOn = !!clickStreamEnabled;
base.plpBackButtonLimit = 10;
base.minTermLength = parseInt(abConfigs.headerSearchMinTermLength) || 1;
base.maxSuggestions = parseInt(abConfigs.headerSearchMaxSuggestions) || 3;
base.imageSize = 'small';

module.exports = base;
