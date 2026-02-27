'use strict';

var base = module.superModule || {};

// AUTOBAHN MOD extend to override and use site prefs
base.seo = base.seo || {};

// Enable Href Langs tags generation into the templates
base.seo.enableHrefLangs = true;
/// Enable Open Graph tags generation into the templates
base.seo.enableOpenGraph = true;
// Enable Page Meta Data tags generation into the templates
base.seo.enablePageMetaData = true;
// Enable schema data generation into the templates
base.seo.enableSchema = true;
// Enable the Product Offline Redirection
base.seo.enableProductOfflineRedirection = false;
// Enable the Category Offline Redirection
base.seo.enableCategoryOfflineRedirection = false;
// Enable the pagination on CLP/PLP pages
base.seo.enablePLPPagination = false;
base.seo.paginationMinimumPagesToDisplayDots = 4;

module.exports = base;
