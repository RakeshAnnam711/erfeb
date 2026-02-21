'use strict';

var CatalogMgr = require('dw/catalog/CatalogMgr');
var HashMap = require('dw/util/HashMap');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var Template = require('dw/util/Template');
var URLUtils = require('dw/web/URLUtils');

var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
var Context = require('*/cartridge/experience/utilities/context.js');
var Url = require('*/cartridge/experience/utilities/url.js');
var Cache = require('*/cartridge/experience/utilities/cache.js');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for the product list page.
 *
 * @param {dw.experience.PageScriptContext} context The page script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 *
 * @returns {string} The markup to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;

    // Apply response cache
    Cache.applyInventorySensitiveCache(response);

    if (content.category) {
        var categoryId = content.category.ID;

        var ProductSearch = require('*/cartridge/models/search/productSearch');
        var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
        var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
        var schemaHelper = require('*/cartridge/scripts/helpers/structuredDataHelper');

        var apiProductSearch = new ProductSearchModel();
        var params = model.queryString || {};

        params.cgid = params.cgid || categoryId;

        model.canonicalUrl = URLUtils.abs('Search-Show', 'cgid', categoryId).toString();
        model.categoryId = categoryId; // used for passing category to belowFold components

        apiProductSearch = searchHelper.setupSearch(apiProductSearch, params);
        var defaultSortingRule = apiProductSearch.category.defaultSortingRule && apiProductSearch.category.defaultSortingRule.ID;
        var sortingRule = apiProductSearch.sortingRule ? apiProductSearch.sortingRule.ID : defaultSortingRule;

        // we do not need to execute the search, that is handled by a component, we just need the meta tags
        pageMetaHelper.setPageMetaTags(request.pageMetaData, apiProductSearch);

        apiProductSearch.search();

        model.productSearch = new ProductSearch(
            apiProductSearch,
            params,
            sortingRule,
            CatalogMgr.getSortingOptions(),
            CatalogMgr.getSiteCatalog().getRoot()
        );
        model.schemaData = schemaHelper.getListingPageSchema(model.productSearch.productIds);
    }

    // automatically register configured regions
    model.regions = PageRenderHelper.getRegionModelRegistry(model.page);

    if (PageRenderHelper.isInEditMode()) {
        var HookManager = require('dw/system/HookMgr');
        HookManager.callHook('app.experience.editmode', 'editmode');
        model.resetEditPDMode = true;
    }

    model.CurrentPageMetaData = PageRenderHelper.getPageMetaData(model.page);

    // Custom page attributes
    model.transparentNavShow = content.transparentNavShow;
    model.transparentNavDarkMode = content.transparentNavDarkMode;
    model.customClass = context.content.customClass || '';

    // adding CurrentHttpParameterMap to the pdict so we don't break certain link cartridges
    model.CurrentHttpParameterMap = request.httpParameterMap;

    // Add data to Context object in order to fetch from child templates
    Context.addContext(model.queryString || null);

    // render the page
    var ajaxRegion = Url.getUrlParameter('ajaxRegion', '?' + model.queryString); // populated when page is requested via ajax
    if (!empty(ajaxRegion)) {
        model.ajaxRegion = ajaxRegion;
        return new Template('experience/pages/ajaxRegion').render(model).text;
    } else {
        model.belowFoldPopulated = model.regions.belowFold.region.size > 0; // check for contents in belowFold region
        return new Template('experience/pages/productListingPage').render(model).text;
    }
};
