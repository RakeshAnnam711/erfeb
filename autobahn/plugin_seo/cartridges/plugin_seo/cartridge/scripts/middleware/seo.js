'use strict';

var ContentMgr = require('dw/content/ContentMgr');
var Resource = require('dw/web/Resource');

/**
 * Add the page meta data for the current controller to the request page meta data
 *
 * @param {Object} req The request wrapper
 * @param {Object} res The response wrapper
 * @param {function} next The next function to execute
 */
function addCurrentPageMetaData(req, res, next) {
    // AUTOBAHN MOD silo prefs to seo site pref group
    if (!require('*/cartridge/config/preferences').seo.enablePageMetaData) {
        return next();
    }

    var resourceKey = 'default.start';

    if (req.session.raw.clickStream.enabled) {
        var lastClickStream = req.session.clickStream.last;
        if (lastClickStream && lastClickStream.pipelineName) {
            resourceKey = lastClickStream.pipelineName.replace('-', '.').toLowerCase();
        }
    } else {
        var pathParts = req.path.split('/');
        resourceKey = pathParts[pathParts.length - 1].replace('-', '.').toLowerCase();
    }

    // AUTOBAHN MODIFICATION pass empty string instead of null values as default fallback
    var title = Resource.msg(resourceKey + '.title', 'seo', '');
    var description = Resource.msg(resourceKey + '.description', 'seo', '');
    var keywords = Resource.msg(resourceKey + '.keywords', 'seo', '');
    var pageMetaTags = undefined;

    var contentAsset = ContentMgr.getContent(resourceKey + '.seo');
    // Content Asset MUST be online, Not-Searchable, Not INCLUDE for Sitemap
    if (!empty(contentAsset)) {
        title = contentAsset.getPageTitle();
        description = contentAsset.getPageDescription();
        keywords = contentAsset.getPageKeywords();
        pageMetaTags = contentAsset.getPageMetaTags();
    }


    require('*/cartridge/scripts/helpers/seoHelper').setPageMetaData(req, {
        key: resourceKey,
        title: !empty(title) ? title: res.viewData.title,
        description: !empty(description) ? description : res.viewData.description,
        keywords: !empty(keywords) ? keywords : res.viewData.keywords,
        pageMetaTags: !empty(pageMetaTags) ? pageMetaTags: res.viewData.pageMetaTags
    });

    next();
}
/**
 * Add the current checkout stage meta data to the request page meta data
 *
 * @param {Object} req The request wrapper
 * @param {Object} res The response wrapper
 * @param {function} next The next function to execute
 */
function addCurrentCheckoutStageMetaData(req, res, next) {
    // AUTOBAHN MOD silo prefs to seo site pref group
    if (!require('*/cartridge/config/preferences').seo.enablePageMetaData) {
        return next();
    }

    var viewData = res.getViewData();
    var currentStage = viewData.currentStage;

    var title = Resource.msg('checkout.' + currentStage + '.title', 'seo', Resource.msg('checkout.default.title', 'seo', null));
    var description = Resource.msg('checkout.' + currentStage + '.description', 'seo', Resource.msg('checkout.default.description', 'seo', null));
    var keywords = Resource.msg('checkout.' + currentStage + '.keywords', 'seo', Resource.msg('checkout.default.keywords', 'seo', null));
    var pageMetaTags = undefined;

    var contentAsset = ContentMgr.getContent('checkout.' + currentStage + '.seo');
    // As the content asset is mainly used for SEO purpose, no need to put it online
    if (!empty(contentAsset)) {
        title = contentAsset.getPageTitle();
        description = contentAsset.getPageDescription();
        keywords = contentAsset.getPageKeywords();
        pageMetaTags = contentAsset.getPageMetaTags();
    }

    require('*/cartridge/scripts/helpers/seoHelper').setPageMetaData(req, {
        key: 'checkout_' + currentStage,
        title: title,
        description: description,
        keywords: keywords,
        pageMetaTags: pageMetaTags
    });

    next();
}

/**
 * Add schema data for the current route
 *
 * @param {Object} req The request wrapper
 * @param {Object} res The response wrapper
 * @param {function} next The next function to execute
 * @returns {function} next
 */
 function addSchemaData(req, res, next) {
    if (!require('*/cartridge/config/preferences').seo.enableSchema) {
        return next();
    }

    const schemaHelper = require('*/cartridge/scripts/helpers/structuredDataHelper');

    var viewData = res.getViewData();
    if (viewData.schemaData || viewData.breadcrumbs) {
        res.setViewData({
            schemaData: schemaHelper.getSchema(viewData)
        });
    }

    return next();
}

/**
 * In case the {enableProductOfflineRedirection} preference is enabled, redirect the customer to the product's primary category page
 * in case the product is offline
 *
 * @param {Object} req The request wrapper
 * @param {Object} res The response wrapper
 * @param {function} next The next function to execute
 */
 function ensureProductOfflineRedirection(req, res, next) {
    if (!require('*/cartridge/config/preferences').seo.enableProductOfflineRedirection || !req.querystring.pid) {
        return next();
    }

    var product = require('dw/catalog/ProductMgr').getProduct(req.querystring.pid);
    // Product is not found in the DB, or is found and online, skip this middleware
    if (empty(product) || product.isOnline()) {
        return next();
    }

    var primaryCategory = product.getPrimaryCategory();
    // Empty primary category, cannot redirect, skip this middleware
    if (empty(primaryCategory)) {
        return next();
    }

    res.redirect(require('dw/web/URLUtils').https('Search-Show', 'cgid', primaryCategory.getID()));
    next();
}

/**
 * In case the {enableCategoryOfflineRedirection} preference is enabled, redirect the customer to the homepage
 * in case the category is offline
 *
 * @param {Object} req The request wrapper
 * @param {Object} res The response wrapper
 * @param {function} next The next function to execute
 */
 function ensureCategoryOfflineRedirection(req, res, next) {
    if (!require('*/cartridge/config/preferences').seo.enableCategoryOfflineRedirection || !req.querystring.cgid) {
        return next();
    }

    var category = require('dw/catalog/CatalogMgr').getCategory(req.querystring.cgid);
    // Category is not found in the DB, or is found and online, skip this middleware
    if (empty(category) || category.isOnline()) {
        return next();
    }

    res.redirect(require('dw/web/URLUtils').https('Home-Show'));
    next();
}

module.exports.addCurrentPageMetaData = addCurrentPageMetaData;
module.exports.addCurrentCheckoutStageMetaData = addCurrentCheckoutStageMetaData;
module.exports.addSchemaData = addSchemaData;
module.exports.ensureProductOfflineRedirection = ensureProductOfflineRedirection;
module.exports.ensureCategoryOfflineRedirection = ensureCategoryOfflineRedirection;
