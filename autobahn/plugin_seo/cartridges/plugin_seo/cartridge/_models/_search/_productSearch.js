'use strict';

var base = module.superModule || {};
var preferences = require('*/cartridge/config/preferences');
var DEFAULT_PAGE_SIZE = preferences.defaultPageSize ? preferences.defaultPageSize : 12;

/**
 * Configures and returns a PagingModel instance
 *
 * @param {dw.util.Iterator} productHits - Iterator for product search results
 * @param {number} count - Number of products in search results
 * @param {number} pageSize - Number of products to display
 * @param {number} startIndex - Beginning index value
 * @return {dw.web.PagingModel} - PagingModel instance
 */
 function getPagingModel(productHits, count, pageSize, startIndex) {
    var PagingModel = require('dw/web/PagingModel');
    var paging = new PagingModel(productHits, count);

    paging.setStart(startIndex || 0);
    paging.setPageSize(pageSize || DEFAULT_PAGE_SIZE);

    return paging;
}

/**
 * Generates Pagination links
 *
 * @param {dw/catalog/ProductSearchModel} productSearch
 * @param {dw/web/PagingModel} currentPaging - Paging model for search result
 * @param {Number} pageSize
 *
 * @return {Object} - Pagination data and links
 */
 function getPaginationLinks(productSearch, currentPaging, pageSize) {
    var currentPageIndex = currentPaging.getCurrentPage();
    var currentPageNumber = currentPageIndex + 1;

    var paginationLinks = [];

    // First page - reset paging
    var paging = currentPaging;
    paging.setStart(0);
    paging.setPageSize(pageSize);
    var pageCount = paging.pageCount;

    var showMoreEndpoint = 'Search-Show';
    var baseUrl = productSearch.url(showMoreEndpoint);

    // Generate all pages links
    for (var pageNumber = 1; pageNumber <= pageCount; ++pageNumber) {
        var finalUrl = paging.appendPaging(baseUrl).append('page', pageNumber);

        if (pageNumber === 1) {
            finalUrl.remove('page');
            finalUrl.remove('start');
            finalUrl.remove('sz');
        }
        paginationLinks.push({
            url: finalUrl,
            active: (pageNumber === currentPageNumber)
        });

        // Prepare for next loop
        paging.setStart(paging.getEnd() + 1);
        paging.setPageSize(pageSize);
    }

    return {
        currentPageNumber : currentPageNumber,
        firstLink: paginationLinks[0],
        lastLink:  paginationLinks[paginationLinks.length - 1],
        prevLink:  pageCount > 1 ? paginationLinks[currentPageIndex - 1] : null,
        nextLink:  pageCount > currentPageNumber ? paginationLinks[currentPageIndex + 1] : null,
        allLinks: paginationLinks
    };
}

function ProductSearch(productSearch, httpParams, sortingRule, sortingOptions, rootCategory) {
    base.apply(this, arguments);

    if (!require('*/cartridge/config/seoPreferences').enablePLPPagination) {
        return;
    }

    var startIdx = parseInt(httpParams.start, 10) || 0;
    this.paginationDetails = getPaginationLinks(
        productSearch,
        getPagingModel(
            productSearch.productSearchHits,
            productSearch.count,
            this.pageSize,
            startIdx
        ),
        this.pageSize
    );
}

module.exports = ProductSearch;