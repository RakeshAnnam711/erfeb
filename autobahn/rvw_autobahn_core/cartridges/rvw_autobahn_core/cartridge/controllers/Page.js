'use strict';

var server = require('server');
server.extend(module.superModule);

var Site = require('dw/system/Site');

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

// Append params to pdict/ViewData
server.prepend('Include', function (req, res, next) {
    var Logger = require('dw/system/Logger');
    var customParamObject;

    if (req.querystring.params) {
        try {
            customParamObject = JSON.parse(req.querystring.params);
            res.setViewData(customParamObject);
        } catch (err) {
            Logger.warn('Error parsing Custom Param Object: {0} [{1}:{2}] Text: {3}', e.toString(), e.fileName, e.lineNumber, req.querystring.params);
        }
    }

    next();
});

/*
 * Custom Page-Include for content assets
 *
 * querystring Params:
 * @param bodyonly (bool) - will remove all markup around an asset and only display the body
 * @param customtitle (string) - being able to pass a dynamic title or text to a rendering template (usefull for dynamic category names in slot/content rendering templates)
 * @param product (oroduct object) - useful to extract and use product specific rendering template as well as the object itself
 * @param template (string) -  directly call and use a rendering template that lives in "/slots/content/" (pass just the template name)
 */
server.append('Include', function (req, res, next) {
    var ProductMgr = require('dw/catalog/ProductMgr');

    var viewData = res.getViewData();

    var template = req.querystring.template;
    var customtitle = req.querystring.customtitle;
    var bodyonly = req.querystring.bodyonly;
    var pid = req.querystring.pid;
    var product = null;

    // Apply setVaryBy = price_promotion flag for cache rule set
    if (req.querystring.personalized === "true") {
        res.personalized = true;
    }

    // Content Model from ViewData
    var content = viewData.content;
    var cid = req.querystring.cid;
    var renderTemplate = content && content.template;
    res.setViewData({ cid: cid });

    if (!empty(content)) {
        if (!empty(content.folderTemplate)) {
            renderTemplate = content.folderTemplate;
        }

        if (pid) {
            product = ProductMgr.getProduct(pid);

            if (!empty(product) && !empty(product.custom.template.value)) {
                renderTemplate = product.custom.template.value;
            }
        }

        if (bodyonly) {
            renderTemplate = '/components/content/contentAssetBodyOnly';
            // if custom template is defined use it, otherwise find classification folder template if it exists, otherwise use default generic
        }

        if (template) {
            renderTemplate = '/slots/content/' + template;
        }

        content.setRenderingTemplate(renderTemplate);

        res.setViewData({
            content: content,
            customtitle: customtitle,
            product: product
        });

        if (content.template) {
            res.render(content.template);
        }
    }

    next();
});

/**
 * Page-IncludeHeaderMenu : This is a local include that includes the navigation in the header
 * @name Base/Page-IncludeHeaderMenu
 * @function
 * @memberof Page
 * @param {middleware} - server.middleware.include
 * @param {middleware} - cache.applyDefaultCache
 * @param {category} - non-sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
 server.replace(
    'IncludeHeaderMenu',
    server.middleware.include,
    cache.applyDefaultCache,
    function (req, res, next) {
        var catalogMgr = require('dw/catalog/CatalogMgr');
        var Categories = require('*/cartridge/models/categories');

        var querystring = req.querystring;
        var rootCatalogID = querystring.catalog || null;
        var rootCategoryID = querystring.cgid || null;
        var siteRootCategory;
        var activeCategoryID = querystring.activecategory || null;
        var secondaryNav = querystring.secondaryNav || false;
        res.setViewData({secondaryNav: secondaryNav});

        // provide default values
        if (res.viewData && res.viewData.siteContext) {
            rootCatalogID = rootCatalogID || res.viewData.siteContext.catalog;
            rootCategoryID = rootCategoryID || res.viewData.siteContext.category;
        }

        // Multi-brand: load rootCatalogID as root menu nav, otherwise use rootCategoryID on current site, or fallback to default site root.
        if (rootCatalogID) {
            var brandCatalog = catalogMgr.getCatalog(rootCatalogID);

            if (brandCatalog) {
                if (rootCategoryID) {
                    var catalogHelpers = require('*/cartridge/scripts/helpers/catalogHelpers');
                    siteRootCategory = catalogHelpers.findMatchingOnlineSubCategory(brandCatalog.root, rootCategoryID);
                } else {
                    siteRootCategory = brandCatalog.getRoot();
                }
            }
        }

        // multi-brand: use category as root
        if (!siteRootCategory && rootCategoryID) {
            siteRootCategory = catalogMgr.getCategory(rootCategoryID);
        }

        // current site catalog
        if (!siteRootCategory) {
            siteRootCategory = catalogMgr.getSiteCatalog().getRoot();
        }

        var topLevelCategories = siteRootCategory.hasOnlineSubCategories() ? siteRootCategory.getOnlineSubCategories() : null;

        var navMenuCategoryDepth = res.viewData.abConfigs.navMenuCategoryDepth;
        var activeCategory = activeCategoryID && catalogMgr.getCategory(activeCategoryID);

        res.render('/components/header/menu', new Categories(topLevelCategories, navMenuCategoryDepth, activeCategory));
        next();
    }
);

// Cache can be overwritten
server.get('IncludeStylesheet', server.middleware.include, cache.applyDefaultCache, function (req, res, next) {
    var viewData = res.getViewData();

    var themeHelper = require('*/cartridge/scripts/helpers/themeHelper');
    var theme = themeHelper.getTheme(viewData);

    res.setViewData({ theme: theme });
    res.render('/common/head/global_theme');

    next();
});

server.append('Show', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    var breadcrumbHelpers = require('*/cartridge/scripts/helpers/breadcrumbHelpers');

    var canonicalUrl = URLUtils.abs('Page-Show', 'cid', req.querystring.cid).toString();
    var viewData = res.getViewData();

    var content = viewData.content;

    viewData.breadcrumbs = [{
        htmlValue: Resource.msg('global.home', 'common', null),
        url: URLUtils.home().toString()
    }];

    if (content) {
        viewData.breadcrumbs.push({
            htmlValue: !empty(content.pageTitle) ? content.pageTitle : content.name
        });

        if (!empty(content.folderTemplate)) {
            content.setRenderingTemplate(content.folderTemplate);

            res.setViewData({content: content});
        }
    }

    res.setViewData({
        breadcrumbs: breadcrumbHelpers.updateHomeURL(viewData),
        canonicalUrl: canonicalUrl
    });

    next();
});

server.get('FolderBasedNavigation', cache.applyDefaultCache, function (req, res, next) {
    var contentSubfolders = require('*/cartridge/scripts/util/getContentSubfolders');
    var folderID = req.querystring.folderid;
    var contentID = req.querystring.contentid;
    var contentArray = contentSubfolders.GetFolders(folderID);

    res.render('components/content/folderBasedNavigation', {
        ContentFolders: contentArray.ContentFolders,
        contentId: contentID
    });
    next();
});

server.append('Locale', cache.applyDefaultCache);

module.exports = server.exports();
