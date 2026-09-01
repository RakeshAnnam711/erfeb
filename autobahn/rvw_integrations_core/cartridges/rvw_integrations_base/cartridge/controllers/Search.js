'use strict';

/**
 * @namespace Search
 */

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

/**
 * Search-Show : This endpoint is called when a shopper type a query string in the search box
 * @name Base/Search-Show
 * @function
 * @memberof Search
 * @param {middleware} - cache.applyShortPromotionSensitiveCache
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - q - query string a shopper is searching for
 * @param {querystringparameter} - search-button
 * @param {querystringparameter} - lang - default is en_US
 * @param {querystringparameter} - cgid - Category ID
 * @param {category} - non-sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.replace('Show', cache.applyShortPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var template = 'search/searchResults';

    // Blank response avoids caching control overrides from search action. Rely on middleware settings
    var blankResponse = {};
    var showSearchPageHelperResult = searchHelper.search(req, blankResponse);
    // Make Search Page Result Helper object (extensible) available to followup appends without causing re-evals
    res.setViewData({ showSearchPageHelperResult: showSearchPageHelperResult });

    if (showSearchPageHelperResult.category && showSearchPageHelperResult.categoryTemplate) {
        template = showSearchPageHelperResult.categoryTemplate;
    }

    var redirectGridUrl = searchHelper.backButtonDetection(req.session.clickStream);
    if (redirectGridUrl) {
        res.cachePeriod = 0;
        res.redirect(redirectGridUrl);
    }

    // Non-category failed search results against a search phrase to be treated as unsupported pages
    if (showSearchPageHelperResult.apiProductSearch.count === 0 && empty(showSearchPageHelperResult.apiProductSearch.category) && !empty(showSearchPageHelperResult.apiProductSearch.searchPhrase)) {
        res.setStatusCode(410);
    }

    res.render(template, {
        productSearch: showSearchPageHelperResult.productSearch,
        maxSlots: showSearchPageHelperResult.maxSlots,
        reportingURLs: showSearchPageHelperResult.reportingURLs,
        refineurl: showSearchPageHelperResult.refineurl,
        category: showSearchPageHelperResult.category ? showSearchPageHelperResult.category : null,
        canonicalUrl: showSearchPageHelperResult.canonicalUrl,
        schemaData: showSearchPageHelperResult.schemaData,
        apiProductSearch: showSearchPageHelperResult.apiProductSearch
    });

    next();
}, pageMetaData.computedPageMetaData);

function prePDViewDataCleanup(req, res, next) {
    // Remove large object value once routing is complete
    this.on('route:BeforeComplete', function (req, res) {
        var rendering = (res.renderings || []).find(function (rendering) { return rendering.type === 'render' });

        if (!rendering || rendering.subType !== 'isml') {
            delete res.viewData.showSearchPageHelperResult;
            delete res.viewData.productSearch;
            delete res.viewData.schemaData;
        }
    });

    next();
}

server.append('Show', prePDViewDataCleanup);
server.append('ShowAjax', prePDViewDataCleanup);
server.append('UpdateGrid', prePDViewDataCleanup);

module.exports = server.exports();
