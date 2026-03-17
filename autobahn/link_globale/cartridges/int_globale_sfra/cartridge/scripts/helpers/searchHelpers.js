'use strict';

var base = module.superModule;
var originalSearch = base.search;
var originalSetupSearch = base.setupSearch;

/**
 * performs a search
 *
 * @param {Object} req - Provided HTTP query parameters
 * @param {Object} res - Provided HTTP query parameters
 * @return {Object} - an object with relevant search information
 * @param {Object} httpParameterMap - Query params
 */
function search(req, res) {
    var globaleSession = require('*/cartridge/models/globale/session');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var searchableProductsPromotionId = globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geSearchableProductsPromotionId);
    if (!globaleSession.get('geOperatedCountry') || !searchableProductsPromotionId) {
        return originalSearch(req, res);
    }
    /**
     * Bellow implementation is a copy of the same method from SFRA '_base' cartridge.
     * It was done for using overridden private method - 'setupSearch'.
     * Please adapt to your implementation in case if you overrided this('search') method in SFRA '_base' cartridge or changed it
     */
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var URLUtils = require('dw/web/URLUtils');
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');

    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var ProductSearch = require('*/cartridge/models/search/productSearch');
    var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
    var schemaHelper = require('*/cartridge/scripts/helpers/structuredDataHelper');

    var apiProductSearch = new ProductSearchModel();
    var categoryTemplate = '';
    var maxSlots = 4;
    var productSearch;
    var reportingURLs;

    var searchRedirect = req.querystring.q ? apiProductSearch.getSearchRedirect(req.querystring.q) : null;

    if (searchRedirect) {
        return { searchRedirect: searchRedirect.getLocation() };
    }

    apiProductSearch = this.setupSearch(apiProductSearch, req.querystring, req.httpParameterMap);
    apiProductSearch.search();

    if (!apiProductSearch.personalizedSort) {
        base.applyCache(res);
    }
    categoryTemplate = base.getCategoryTemplate(apiProductSearch);
    productSearch = new ProductSearch(
        apiProductSearch,
        req.querystring,
        req.querystring.srule,
        CatalogMgr.getSortingOptions(),
        CatalogMgr.getSiteCatalog().getRoot()
    );

    pageMetaHelper.setPageMetaTags(req.pageMetaData, productSearch);

    var canonicalUrl = URLUtils.abs('Search-Show', 'cgid', req.querystring.cgid);
    var refineurl = URLUtils.url('Search-Refinebar');
    var whitelistedParams = ['q', 'cgid', 'pmin', 'pmax', 'srule', 'pmid'];
    var isRefinedSearch = false;

    Object.keys(req.querystring).forEach(function (element) {
        if (whitelistedParams.indexOf(element) > -1) {
            refineurl.append(element, req.querystring[element]);
        }

        if (['pmin', 'pmax'].indexOf(element) > -1) {
            isRefinedSearch = true;
        }

        if (element === 'preferences') {
            var i = 1;
            isRefinedSearch = true;
            Object.keys(req.querystring[element]).forEach(function (preference) {
                refineurl.append('prefn' + i, preference);
                refineurl.append('prefv' + i, req.querystring[element][preference]);
                i++;
            });
        }
    });

    if (productSearch.searchKeywords !== null && !isRefinedSearch) {
        reportingURLs = reportingUrlsHelper.getProductSearchReportingURLs(productSearch);
    }

    var result = {
        productSearch: productSearch,
        maxSlots: maxSlots,
        reportingURLs: reportingURLs,
        refineurl: refineurl,
        canonicalUrl: canonicalUrl,
        apiProductSearch: apiProductSearch
    };

    if (productSearch.isCategorySearch && !productSearch.isRefinedCategorySearch && categoryTemplate && apiProductSearch.category.parent.ID === 'root') {
        pageMetaHelper.setPageMetaData(req.pageMetaData, productSearch.category);
        result.category = apiProductSearch.category;
        result.categoryTemplate = categoryTemplate;
    }

    if (!categoryTemplate || categoryTemplate === 'rendering/category/categoryproducthits') {
        result.schemaData = schemaHelper.getListingPageSchema(productSearch.productIds);
    }

    // Mirror the core fallback behavior for zero-result keyword searches.
    if (req.querystring.q && Number(result.productSearch.count) === 0) {
        var fallbackSearch = new ProductSearchModel();
        var fallbackParams = { sz: 30 };
        var rootCategory = CatalogMgr.getSiteCatalog().getRoot();
        var fallbackCategory = CatalogMgr.getCategory('new-arrivals');
        var activeFallbackCategory = fallbackCategory && fallbackCategory.isOnline() ? fallbackCategory : rootCategory;
        var fallbackSearchParams = { sz: 30 };

        if (req.querystring.srule) {
            fallbackParams.srule = req.querystring.srule;
            fallbackSearchParams.srule = req.querystring.srule;
        }

        if (activeFallbackCategory) {
            fallbackSearchParams.cgid = activeFallbackCategory.ID;
            fallbackParams.cgid = activeFallbackCategory.ID;
        }

        fallbackSearch = this.setupSearch(fallbackSearch, fallbackSearchParams, req.httpParameterMap);
        fallbackSearch.search();

        var fallbackCount = Number(fallbackSearch.count) || 0;
        if (fallbackCount > 30) {
            var maxStart = fallbackCount - 30;
            var pageBlockCount = Math.floor(maxStart / 30) + 1;
            fallbackParams.start = Math.floor(Math.random() * pageBlockCount) * 30;
        }

        result.productSearch = new ProductSearch(
            fallbackSearch,
            fallbackParams,
            fallbackParams.srule,
            CatalogMgr.getSortingOptions(),
            rootCategory
        );
        result.productSearch.searchKeywords = req.querystring.q;
        result.productSearch.noResultsFallback = true;
        result.productSearch.originalSearchQuery = req.querystring.q;
        result.apiProductSearch = fallbackSearch;
        result.refineurl = URLUtils.url('Search-Refinebar', 'cgid', fallbackParams.cgid, 'sz', 30);
        result.noResultsQuery = req.querystring.q;
        result.noResultsFallback = true;
    }

    return result;
}

/**
 * Set search configuration values
 *
 * @param {dw.catalog.ProductSearchModel} apiProductSearch - API search instance
 * @param {Object} params - Provided HTTP query parameters
 * @return {dw.catalog.ProductSearchModel} - API search instance
 * @param {Object} httpParameterMap - Query params
 */
function setupSearch(apiProductSearch, params, httpParameterMap) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var originalApiProductSearch = originalSetupSearch(apiProductSearch, params, httpParameterMap);

    return globaleHelpers.applySearchableProductsPromotion(originalApiProductSearch); // apply searchable products promotion
}

module.exports = base;
module.exports.search = search;
module.exports.setupSearch = setupSearch;
