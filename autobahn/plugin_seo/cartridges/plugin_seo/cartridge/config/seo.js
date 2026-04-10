'use strict';

// AUTOBAHN MOD convert to sitepreference override function
const prefPrefix = 'pluginSEO_';

var currentSite = require('dw/system/Site').getCurrent() || { getCustomPreferenceValue: function () { return; } };

var base = module.superModule || {};

/****
 * Defaults
 ****/
// Enable Href Langs tags generation into the templates
base.enableHrefLangs = true;
/// Enable Open Graph tags generation into the templates
base.enableOpenGraph = true;
// Enable Page Meta Data tags generation into the templates
base.enablePageMetaData = true;
// Enable schema data generation into the templates
base.enableSchema = true;
// Enable the Product Offline Redirection
base.enableProductOfflineRedirection = false;
// Enable the Category Offline Redirection
base.enableCategoryOfflineRedirection = false;
// Enable the pagination on CLP/PLP pages
base.enablePLPPagination = false;
base.paginationMinimumPagesToDisplayDots = 4;

/****
 * Apply site preference values
 ****/
[
    'enableHrefLangs',
    'enableOpenGraph',
    'enablePageMetaData',
    'enableSchema',
    'enableProductOfflineRedirection',
    'enableCategoryOfflineRedirection',
    'enablePLPPagination',
    'paginationMinimumPagesToDisplayDots'
].forEach(function (pluginSEOPref) {
    var prefValue = currentSite.getCustomPreferenceValue(prefPrefix + pluginSEOPref);

    if (!empty(prefValue)) base[pluginSEOPref] = prefValue;
});


module.exports = base;
