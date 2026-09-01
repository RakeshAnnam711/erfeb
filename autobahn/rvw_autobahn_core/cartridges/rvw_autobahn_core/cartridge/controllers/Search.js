'use strict';

var server = require('server');
server.extend(module.superModule);

var CatalogMgr = require('dw/catalog/CatalogMgr');
var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');
var StringUtils = require('dw/util/StringUtils');
var URLUtils = require('dw/web/URLUtils');

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

function getBreadcrumbs(result, fullCategory) {
    var breadcrumbs = [];

    if (!empty(fullCategory)) {
        breadcrumbs.push({
            // WGACA MODIFICATION - remove additional h1 tags
            // htmlValue: '<h1>' + fullCategory.displayName + '</h1>',
            htmlValue: fullCategory.displayName,
            url: ''
        })

        var parentCategory = fullCategory;
        while (parentCategory && !parentCategory.isTopLevel()) {
            parentCategory = parentCategory.parent;
            if (parentCategory) {
                breadcrumbs.unshift({
                    htmlValue: parentCategory.displayName,
                    url: URLUtils.url('Search-Show', 'cgid', parentCategory.ID).toString()
                });
            }
        }
    } else {
        var keyword = StringUtils.stringToHtml(result.productSearch.searchKeywords || '');

        if (!empty(keyword)) {
            breadcrumbs.push({
                htmlValue: Resource.msgf('label.searchfor', 'search', null, keyword),
                url: ''
            });
        }
    }

    breadcrumbs.unshift({
        htmlValue: Resource.msg('global.home', 'common', null),
        url: URLUtils.home().toString()
    });

    return breadcrumbs;
}

function updateShowViewData(req, res, next) {
    var viewData = res.getViewData();

    if (viewData.productSearch) {
        var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
        var contentSearch = searchHelper.setupContentSearch(req.querystring);
        var contentCount = !empty(contentSearch) ? contentSearch.contentCount : 0;
        var fullCategory = viewData.productSearch.category ? CatalogMgr.getCategory(viewData.productSearch.category.id) : '';

        var breadcrumbHelpers = require('*/cartridge/scripts/helpers/breadcrumbHelpers');

        if (req.querystring.cgid) {
            var canonicalUrl = URLUtils.abs('Search-Show', 'cgid', req.querystring.cgid).toString();
            viewData.canonicalUrl = canonicalUrl;
        } else if (req.querystring.q) {
            var canonicalUrl = URLUtils.abs('Search-Show', 'q', req.querystring.q).toString();
            viewData.canonicalUrl = canonicalUrl;
        }

        // pass through the color refinement values if specified
        var refinementValues = null;
        var element ='preferences';
        if(!empty(req.querystring[element])) {
            Object.keys(req.querystring[element]).forEach(function (preference) {
                if(preference.toLowerCase().indexOf('color') > -1) {
                    refinementValues = {
                        key: preference,
                        values: req.querystring[element][preference]
                    };
                }
            });
        }
        viewData.refinementValues = refinementValues;
        viewData.contentCount = contentCount;
        viewData.fullCategory = fullCategory;
        viewData.breadcrumbs = getBreadcrumbs(viewData, fullCategory);
        viewData.breadcrumbs = breadcrumbHelpers.updateHomeURL(viewData);

        res.setViewData(viewData);

        if (!empty(viewData.CurrentPageMetaData)) {
            var customPrefixHeader = 'X-SF-CC-';

            ['description','keywords','title'].forEach(tag => {
                if (!empty(viewData.CurrentPageMetaData[tag])) {
                    res.setHttpHeader(customPrefixHeader + tag.toUpperCase(), viewData.CurrentPageMetaData[tag]);
                }
            });
        }

    }

    next();
}

server.append('Show', updateShowViewData);

server.append('ShowAjax', updateShowViewData, function (req, res, next) {
    // Return regular Search-Show url to update browser history
    var historyUrl = URLUtils.https('Search-Show');
    var params = req.querystring.toString().split('&');

    params.forEach(function (param) {
        param = decodeURIComponent(param);

        var paramObj = param && param.split('=');
        var key = paramObj && paramObj[0];
        var value = paramObj && paramObj[1];

        if (['selectedUrl'].indexOf(key) === -1) {
            if (['string', 'number'].indexOf(typeof value) !== -1) {
                historyUrl.append(key, value);
            }
        }
    });

    res.setViewData({historyUrl: historyUrl.toString()});
    next();
});

server.prepend('Show', function (req, res, next) {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var apiProductSearch = new ProductSearchModel();

    if (req.querystring.q) {
        var searchRedirect = apiProductSearch.getSearchRedirect(req.querystring.q);

        if (searchRedirect) {
            res.redirect(searchRedirect.location);
        }
    }

    next();
});

server.append('Content', function (req, res, next) {
    var preferenceHelper = require('*/cartridge/scripts/helpers/preferenceHelper');
    var viewData = res.getViewData();

    // Add column classes based on site preference
    var contentPerRowMobile = parseInt(preferenceHelper.getAttributeValue('contentPerRowMobile'), 10);
    var contentPerRowDesktop = parseInt(preferenceHelper.getAttributeValue('contentPerRowDesktop'), 10);
    viewData.mobileRowClass = contentPerRowMobile === 2 ? 'col-6' : 'col-12';
    viewData.desktopRowClass = contentPerRowDesktop === 4 ? 'col-sm-3' : contentPerRowDesktop === 3 ? 'col-sm-4' : 'col-sm-6';

    res.setViewData(viewData);

    next();
});

server.append('UpdateGrid', function (req, res, next) {
    // pass through the color refinement values if specified
    var refinementValues = null;
    var element ='preferences';

    if(!empty(req.querystring[element])) {
        Object.keys(req.querystring[element]).forEach(function (preference) {
            if(preference.toLowerCase().indexOf('color') > -1) {
                refinementValues = {
                    key: preference,
                    values: req.querystring[element][preference]
                };
            }
        });
    }

    res.viewData.refinementValues = refinementValues;

    next();
});

/**
 * Search-ShowContent : This endpoint existed in SiteGenesis, but was dropped from SFRA. Used to support content folder searches.
 * @name Core/Search-ShowContent
 * @function
 * @memberof Search
 * @param {middleware} - cache.applyShortPromotionSensitiveCache
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - fdid - query string for parent folder to search
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.get('ShowContent', cache.applyShortPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var folderHelper = require('*/cartridge/scripts/helpers/folderHelpers');
    var siteLibrary = ContentMgr.getSiteLibrary();
    var siteRootFolder = siteLibrary.getRoot();
    var folderId = req.querystring.fdid;
    var blogData = folderHelper.getBlogData(folderId);
    var canonicalUrl = URLUtils.abs('Search-ShowContent', 'fdid', folderId).toString();
    var customStartingPage = req.querystring.customStartingPage || 0;
    var isAjax = req.querystring.ajax || false;
    var searchParams = {
        q: folderId,
        context: 'folder', // enables searching by folder instead of search phrase
        startingPage: 0,
        pageSize: 10000 // hardcoding pageSize to large value to support custom sort and pagination
    }

    var contentSearch = searchHelper.setupContentSearch(searchParams);
    searchHelper.sortContentResults(contentSearch.contents);
    searchHelper.paginateContentResults(contentSearch, customStartingPage);

    // Add column classes based on site preference
    contentSearch.mobileRowClass = blogData.blogsPerRowMobile === 2 ? 'col-6' : 'col-12';
    contentSearch.desktopRowClass = blogData.blogsPerRowDesktop === 4 ? 'col-sm-3' : blogData.blogsPerRowDesktop === 3 ? 'col-sm-4' : 'col-sm-6';

    var viewDataObject = {
        contentSearch: contentSearch,
        customStartingPage: customStartingPage
    }

    if (isAjax) {
        // used to load additional content with the 'more' button
        res.render('/blog/landingNoDecorator', viewDataObject);
    } else {
        var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
        var folderMetaObject = folderHelper.getFolderMetaObject(folderId);
        var pageMetaObject = {};

        // additional data for blogs (i.e. any content folder that matches or is child of a folder defined in blogParentFolders pref)
        if (blogData.isBlogFolder) {
            // for backwards compatibility: use assets with no suffix only if the original default blog root folder is used
            var legacyBlogRootFolderId = Resource.msg('blog.folderid', 'components', null);
            var topAssetId = 'blog-landing-top' + (folderId === legacyBlogRootFolderId ? '' : '-' + folderId);
            var bottomAssetId = 'blog-landing-bottom' + (folderId === legacyBlogRootFolderId ? '' : '-' + folderId);

            var blogCategories = folderHelper.getSubFolders(blogData.rootFolderId);
            var activeIds = [];
            folderHelper.getActiveCategoryIds(blogCategories, folderId, blogData.rootFolderId, activeIds);

            viewDataObject.rootFolderId = blogData.rootFolderId;
            viewDataObject.blogCategories = blogCategories;
            viewDataObject.activeIds = activeIds;
            viewDataObject.blogTopAssetId = topAssetId;
            viewDataObject.blogBottomAssetId = bottomAssetId;

            // set up blog-specific metadata fallback hierarchy
            var Site = require('dw/system/Site');
            var siteName = Site.getCurrent().name;
            var rootFolderMetaObject = folderHelper.getFolderMetaObject(blogData.rootFolderId);
            var fallbackMetaObject = {
                pageTitle: Resource.msg('meta.blog.title', 'components', null),
                pageDescription: Resource.msgf('meta.blog.description', 'components', null, siteName),
                pageKeywords: Resource.msgf('meta.blog.keywords', 'components', null, siteName)
            }
            // populate blog metadata in this order: 1) folder-level, 2) root-folder-level, 3) resource strings
            pageMetaObject = {
                pageTitle: folderMetaObject.pageTitle || rootFolderMetaObject.pageTitle || fallbackMetaObject.pageTitle,
                pageDescription: folderMetaObject.pageDescription || rootFolderMetaObject.pageDescription || fallbackMetaObject.pageDescription,
                pageKeywords: folderMetaObject.pageKeywords || rootFolderMetaObject.pageKeywords || fallbackMetaObject.pageKeywords
            }
        } else {
            // use folder-level metadata only for non-blog content
            pageMetaObject = {
                pageTitle: folderMetaObject.pageTitle,
                pageDescription: folderMetaObject.pageDescription,
                pageKeywords: folderMetaObject.pageKeywords
            }
        }

        pageMetaHelper.setPageMetaData(req.pageMetaData, pageMetaObject);

        res.setViewData({
            canonicalUrl: canonicalUrl
        });

        res.render('/blog/landing', viewDataObject);
    }

    next();
}, pageMetaData.computedPageMetaData);


/**
 * Search-ShowContent : This endpoint existed in SiteGenesis, but was dropped from SFRA. Used to support content folder searches.
 * @name Core/Search-ShowContent
 * @function
 * @memberof Search
 * @param {middleware} - cache.applyShortPromotionSensitiveCache
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - fdid - query string for parent folder to search
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.get('TileFocusJSON', function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var ProductMgr = require('dw/catalog/ProductMgr');

        var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');

        var pid = searchHelper.pidFromClickstream(req.session.clickStream);
        var product = !empty(pid) ? ProductMgr.getProduct(pid) : null;
        var master = product && product.variant ? (product.variationModel && product.variationModel.master) : null;
        var pids = []

        if (product) pids.push(product.ID);
        if (master) pids.push(master.ID);

        res.viewData = {};
        res.json(pids.length > 0 ? {pids: pids} : {});
    });

    next();
});

module.exports = server.exports();
