'use strict';

var page = module.superModule;
var server = require('server');
server.extend(page);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.append('Refinebar', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var globaleSession = require('*/cartridge/models/globale/session');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var priceBookHelpers = require('*/cartridge/scripts/helpers/priceBookHelpers');
    var Logger = require('dw/system/Logger');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelper');
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var URLUtils = require('dw/web/URLUtils');
    var viewData = res.getViewData();

    if (
        globaleSession.get('geOperatedCountry')
        && (globaleSession.get('gePriceStrategy') === globaleHelpers.consts.priceStrategy.FIXED)
        && globaleSession.get('geUseFixedPricesOnly')
        && viewData.productSearch && Array.isArray(viewData.productSearch.refinements) && viewData.productSearch.refinements.length > 0
    ) {
        var filteredRefinements = viewData.productSearch.refinements.filter(function (refinement) {
            return !(refinement.isPriceRefinement && priceBookHelpers.getApplicableFixedPricebooksIDs().length === 0);
        });
        Object.defineProperty(viewData.productSearch, 'refinements', {
            get: function () {
                return filteredRefinements;
            }
        });
    }
    var refinements = viewData.productSearch.refinements;
    var selectedFilters = searchHelper.getSelectedFilters(refinements, viewData.productSearch);
    var filtersInGroup = searchHelper.transformFiltersInGroup(selectedFilters);
    var selectedFiltersByGroup = {};
    try {
        selectedFiltersByGroup = Object.fromEntries(filtersInGroup);
    } catch (err) {
        Logger.warn('Search-Refinebar: Failed to transform map to object using Object.fromEntries function.');
        selectedFiltersByGroup = searchHelper.mapToObject(filtersInGroup);
    }
    viewData.productSearch.selectedFiltersByGroup = selectedFiltersByGroup;
    viewData.productSearch.filterCount = selectedFilters.length.toString();

    if (viewData.productSearch) {
        var categoryID = viewData.productSearch.category && viewData.productSearch.category.id;
        var resetLink = categoryID
            ? URLUtils.url('Search-Show', searchHelper.cgidKey, categoryID)
            : URLUtils.url('Search-Show', 'q', req.querystring.q || '');
        viewData.productSearch.resetLink = resetLink;
    }

    next();
});

server.replace('Refinebar', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleSession = require('*/cartridge/models/globale/session');
    var priceBookHelpers = require('*/cartridge/scripts/helpers/priceBookHelpers');

    if (
        globaleSession.get('geOperatedCountry')
        && (globaleSession.get('gePriceStrategy') === globaleHelpers.consts.priceStrategy.FIXED)
        && globaleSession.get('geUseFixedPricesOnly')
    ) {
        priceBookHelpers.applyFixedPriceBooks(
            function () { page.Refinebar.call(this, req, res, next); },
            function () { page.Refinebar.call(this, req, res, next); }
        );
    } else {
        page.Refinebar.call(this, req, res, next);
    }
});

server.replace('UpdateGrid', function (req, res, next) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleSession = require('*/cartridge/models/globale/session');
    var priceBookHelpers = require('*/cartridge/scripts/helpers/priceBookHelpers');

    if (
        globaleSession.get('geOperatedCountry')
        && (globaleSession.get('gePriceStrategy') === globaleHelpers.consts.priceStrategy.FIXED)
        && globaleSession.get('geUseFixedPricesOnly')
    ) {
        priceBookHelpers.applyFixedPriceBooks(
            function () { page.UpdateGrid.call(this, req, res, next); },
            function () { page.UpdateGrid.call(this, req, res, next); }
        );
    } else {
        page.UpdateGrid.call(this, req, res, next);
    }
});

server.replace('ShowAjax', cache.applyShortPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleSession = require('*/cartridge/models/globale/session');
    var priceBookHelpers = require('*/cartridge/scripts/helpers/priceBookHelpers');

    if (
        globaleSession.get('geOperatedCountry')
        && (globaleSession.get('gePriceStrategy') === globaleHelpers.consts.priceStrategy.FIXED)
        && globaleSession.get('geUseFixedPricesOnly')
    ) {
        priceBookHelpers.applyFixedPriceBooks(
            function () { page.ShowAjax.call(this, req, res, next); },
            function () { page.ShowAjax.call(this, req, res, next); }
        );
    } else {
        page.ShowAjax.call(this, req, res, next);
    }
}, pageMetaData.computedPageMetaData);

server.replace('Show', cache.applyShortPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleSession = require('*/cartridge/models/globale/session');
    var priceBookHelpers = require('*/cartridge/scripts/helpers/priceBookHelpers');

    if (
        globaleSession.get('geOperatedCountry')
        && (globaleSession.get('gePriceStrategy') === globaleHelpers.consts.priceStrategy.FIXED)
        && globaleSession.get('geUseFixedPricesOnly')
    ) {
        priceBookHelpers.applyFixedPriceBooks(
            function () { page.Show.call(this, req, res, next); },
            function () { page.Show.call(this, req, res, next); }
        );
    } else {
        page.Show.call(this, req, res, next);
    }
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();
