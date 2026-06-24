'use strict';

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var searchHelper = require("*/cartridge/scripts/helpers/searchHelper");
var Logger = require('dw/system/Logger');

var searchShowPage = 'Search-Show';

server.prepend('UpdateGrid', function (req, res, next) {
	res.setHttpHeader(require('dw/system/Response').X_ROBOTS_TAG, 'noindex, nofollow, noarchive');
	next();
});

server.append('Show', function (req, res, next) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var URLUtils = require('dw/web/URLUtils');

    var viewData = res.getViewData();
    var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');

    if (viewData.productSearch && viewData.productSearch.category) {
        var categoryID = viewData.productSearch.category.id;
        req.session.privacyCache.set('prevCategory', categoryID);
        var breadcrumbsArray = productHelpers.getAllBreadcrumbs(categoryID, null, []).reverse();
        viewData.gtmBreadcrumbs = breadcrumbsArray.map(b => b.htmlValue);
        viewData.item_list_name = viewData.productSearch.category.displayName;
        viewData.item_list_id = viewData.productSearch.category.id;
    }

    var currentCustomer = req.currentCustomer;
    var currentCustomerRawID = currentCustomer.raw.ID;
    session.custom.currentCustomer = currentCustomerRawID;

    if (req.querystring && (req.querystring.j || req.querystring.sfmc_sub || req.querystring.l || req.querystring.u || req.querystring.mid || req.querystring.mid || req.querystring.jb)) {
        var conversionTrackerHelper = require('*/cartridge/scripts/helpers/conversionTrackerHelper');
        var conversionParams = {
            jobID: req.querystring.j,
            subscriberID: req.querystring.sfmc_sub,
            listID: req.querystring.l,
            landingPageID: req.querystring.u,
            memberID: req.querystring.mid,
            batchID: req.querystring.jb,
            pID: req.querystring.pid,
            linkAlias: req.querystring.cgid || req.querystring.q
        };
        conversionTrackerHelper.setConversionCookie(conversionParams);
    }
    viewData.currentCustomer = currentCustomer;

    next();
});

server.append('Refinebar', cache.applyDefaultCache, function (req, res, next) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var URLUtils = require('dw/web/URLUtils');
    var viewData = res.getViewData();
    var mainCategoryUrl = viewData.productSearch.resetLink;
    var refinements = viewData.productSearch.refinements;

    if (refinements) {
        refinements.forEach(refinement => {
            if (refinement.isCategoryRefinement) {
                var values = searchHelper.updateRefinementSubCategories(refinement.values, mainCategoryUrl);
                refinement.values = values;
            }
        });
    }
    var selectedFilters = searchHelper.getSelectedFilters(refinements, viewData.productSearch);
    var filtersInGroup = searchHelper.transformFiltersInGroup(selectedFilters);
    var selectedFiltersByGroup = {};
    try {
        selectedFiltersByGroup = Object.fromEntries(filtersInGroup);
    } catch (err) {
        Logger.warn("Search-Refinebar: Failed to transform map to object using Object.fromEntries function.");
        selectedFiltersByGroup = searchHelper.mapToObject(filtersInGroup);
    }
    viewData.productSearch.selectedFiltersByGroup = selectedFiltersByGroup;
    viewData.productSearch.filterCount = selectedFilters.length.toString();

    if (viewData.productSearch) {
        var categoryID = viewData.productSearch.category.id;
        var resetLink = URLUtils.url(searchShowPage, searchHelper.cgidKey, categoryID);
        viewData.productSearch.resetLink = resetLink;
    }

    next();
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();
