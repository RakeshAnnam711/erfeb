'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var URLUtils = require('dw/web/URLUtils');
var CatalogMgr = require('dw/catalog/CatalogMgr');

function getBreadcrumbs(result, fullCategory) {
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var breadcrumbs = [];

    if (!empty(fullCategory)) {
        breadcrumbs.push({
            htmlValue: fullCategory.displayName,
            url: ''
        })

        var parentCategory = fullCategory;
        while (!parentCategory.isTopLevel()) {
            parentCategory = parentCategory.parent;
            breadcrumbs.unshift({
                htmlValue: parentCategory.displayName,
                url: URLUtils.url('Search-Show', 'cgid', parentCategory.ID).toString()
            });
        }
    } else {
        var keyword = result.productSearch.searchKeywords;
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

module.exports.render = function (context, modelIn) {
    var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var ProductSearch = require('*/cartridge/models/search/productSearch');
    var SearchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var gtmHelpers = require('*/cartridge/scripts/gtm/gtmHelpers');
    var Preferences = require('*/cartridge/config/preferences');
    var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');
    var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');

    var model = ViewDataModel(context, modelIn);
    var component = context.component;
    var content = context.content;
    var category = content.category;
    var categoryID = category ? category.ID : 'root';
    var queryString = content.queryString;
    var params = (content.queryString ? JSON.parse(content.queryString) : model.queryString) || {};
    params.cgid = params.cgid ? params.cgid : categoryID;
    var regions = PageRenderHelper.getRegionModelRegistry(component);
    var pageSize = Preferences.defaultPageSize ? Preferences.defaultPageSize : 12;
    var tileStart = params.start || 0;
    var plpColumnCount = model.abConfigs.productsPerRowDesktop === 'three' ? 3 : 4;

    // WGACA MODIFICATION - pass category object (already part of search model)
    model.fullCategory = category;
    // Passing price filtering as separate param in SearchHelper.setupSearch so setProductProperties in search.js can process it
    var priceParams = {};
    if ('pmin' in params) {
        priceParams.pmin = {
            value: params.pmin,
            doubleValue: parseInt(params.pmin, 10)
        }
    }
    if ('pmax' in params) {
        priceParams.pmax = {
            value: params.pmax,
            doubleValue: parseInt(params.pmax, 10)
        }
    }

    model.apiProductSearch = new ProductSearchModel();
    model.apiProductSearch = SearchHelper.setupSearch(model.apiProductSearch, params, priceParams);
    var defaultSortingRule = model.apiProductSearch.category.defaultSortingRule && model.apiProductSearch.category.defaultSortingRule.ID;
    var sortingRule = model.apiProductSearch.sortingRule ? model.apiProductSearch.sortingRule.ID : defaultSortingRule;

    // get count of promo tiles on the page
    var promoTileCount = 0;
    for (var index = tileStart; index < (pageSize + tileStart); index++) {
        var tileNumber = index + 1;
        var promoTileRegion = 'promoTile' + tileNumber;
        var promoTileSpan = promoTileRegion + 'ColumnSpan';

        if (regions[promoTileRegion] && regions[promoTileRegion].region.size > 0) {
            if (content[promoTileSpan] && content[promoTileSpan].value && content[promoTileSpan].value.length > 0) {
                // check if promoTiles span multiple columns, count each column as a grid slot.
                var spanChange = parseInt(content[promoTileSpan]['value'] > 0 ? content[promoTileSpan]['value'] : 1);
                // if the preference was set to 4 when selections were made and then changed to 3 make any '4' selections = '3'
                spanChange = spanChange > plpColumnCount ? spanChange - 1 : spanChange;
                promoTileCount = promoTileCount + spanChange;
            } else {
                promoTileCount = promoTileCount + 1;
            }
        }
    }

    // reduce page size to account for presence of promo tiles
    if (promoTileCount > 0 && !params.isSortUpdate) {
        params.sz = (params.sz ? params.sz : pageSize) - promoTileCount;
    }

    // Populate refinement colors to preselect in tiles
    var refinementColors = null;
    if ('preferences' in params && !empty(params.preferences)) {
        Object.keys(params.preferences).forEach(function(key) {
            if (key === 'refinementColor') {
                refinementColors = {
                    key: key,
                    values: params.preferences[key]
                }
            }
            model.refinementValues = refinementColors;
        });
    }

    model.apiProductSearch.search();

    var productSearch = new ProductSearch(
        model.apiProductSearch,
        params,
        sortingRule,
        CatalogMgr.getSortingOptions(),
        CatalogMgr.getSiteCatalog().getRoot()
    );

    // add promo tiles to productIds list
    if (promoTileCount > 0) {

        // update results count for paginated results to account for promo tiles
        productSearch.count = productSearch.count > pageSize ? productSearch.count - promoTileCount : productSearch.count;

        for (var index = 0; index < pageSize; index++) {
            var tileNumber = index + 1;
            var promoTileRegion = 'promoTile' + tileNumber;
            var promoTileSpan = promoTileRegion + 'ColumnSpan';

            if (regions[promoTileRegion] && regions[promoTileRegion].region.size > 0) {
                if (content[promoTileSpan] && content[promoTileSpan].value && content[promoTileSpan].value.length > 0) {
                    var spanChange = parseInt(content[promoTileSpan]['value'] > 0 ? content[promoTileSpan]['value'] : 1);
                    // if the preference was set to 4 when selections were made and then changed to 3 make any '4' selections = '3'
                    spanChange = spanChange > plpColumnCount ? spanChange - 1 : spanChange;
                    productSearch.productIds.splice(index, 0, {
                        spanChange: spanChange,
                        promoTile: regions[promoTileRegion].render() // pass component's html to use in the template
                    });

                } else {
                    productSearch.productIds.splice(index, 0, {
                        promoTile: regions[promoTileRegion].render() // pass component's html to use in the template
                    });
                }
            }
        }
    }

    model.productSearch = productSearch;
    model.regions = regions.container;
    model.containerClass = content.containerClass || '';
    model.breadcrumbs = getBreadcrumbs(productSearch, category);

    model.refineurl = URLUtils.url('Search-Refinebar');
    var allowedParams = ['q', 'cgid', 'pmin', 'pmax', 'srule', 'pmid'];
    model.isRefinedSearch = false;

    Object.keys(params).forEach(function (element) {
        if (allowedParams.indexOf(element) > -1) {
            model.refineurl.append(element, params[element]);
        }

        if (['pmin', 'pmax'].indexOf(element) > -1) {
            model.isRefinedSearch = true;
        }

        if (element === 'preferences') {
            var i = 1;
            model.isRefinedSearch = true;
            Object.keys(params[element]).forEach(function (preference) {
                model.refineurl.append('prefn' + i, preference);
                model.refineurl.append('prefv' + i, params[element][preference]);
                i++;
            });
        }
    });

    if (productSearch.searchKeywords !== null && !isRefinedSearch) {
        model.reportingURLs = reportingUrlsHelper.getProductSearchReportingURLs(productSearch);
    }

    model.refineurl = URLUtils.url('Search-Refinebar');
    var allowedParams = ['q', 'cgid', 'pmin', 'pmax', 'srule', 'pmid'];
    model.isRefinedSearch = false;

    Object.keys(params).forEach(function (element) {
        if (allowedParams.indexOf(element) > -1) {
            model.refineurl.append(element, params[element]);
        }

        if (['pmin', 'pmax'].indexOf(element) > -1) {
            model.isRefinedSearch = true;
        }

        if (element === 'preferences') {
            var i = 1;
            model.isRefinedSearch = true;
            Object.keys(params[element]).forEach(function (preference) {
                model.refineurl.append('prefn' + i, preference);
                model.refineurl.append('prefv' + i, params[element][preference]);
                i++;
            });
        }
    });

    if (productSearch.searchKeywords !== null && !model.isRefinedSearch) {
        model.reportingURLs = reportingUrlsHelper.getProductSearchReportingURLs(productSearch);
    }

    return new Template('experience/components/commerce_layouts/search/searchResults').render(model).text;
};
