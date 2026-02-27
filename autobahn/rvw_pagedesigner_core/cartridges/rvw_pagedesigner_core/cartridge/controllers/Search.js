'use strict';

var server = require('server');
server.extend(module.superModule);

function searchShowViewData(req, res, next) {
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');

    if (req.querystring.cgid) {
        var pageLookupResult = searchHelper.getPageDesignerCategoryPage(req.querystring.cgid);

        if (pageLookupResult.page) {
            pageLookupResult.aspectAttributes.put('queryString', JSON.stringify(req.querystring));

            // Cache is reset by cartridge/scripts/hooks/pageDesignerCache
            // res.cachePeriod = 0;
            res.page(pageLookupResult.page.ID, {}, pageLookupResult.aspectAttributes);
        }
    }

    next();
}

server.append('Show', searchShowViewData);
server.append('ShowAjax', searchShowViewData);
server.append('UpdateGrid', searchShowViewData);

server.get('UpdatePDContentGrid', function(req, res, next) {
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var customStartingPage = req.querystring.customStartingPage || 0;
    var resultLimit = req.querystring.resultLimit;

    var searchParams = {
        q: req.querystring.q,
        context: 'folder', // enables searching by folder instead of search phrase
        pageSize: 10000, // hard-coding to large value to support custom sort and pagination (SFRA does not support sorting on PD attributes)
        startingPage: 0
    }
    var contentSearch = searchHelper.setupContentSearch(searchParams);

    searchHelper.sortContentResults(contentSearch.contents);
    contentSearch.contents.splice(resultLimit); // truncate to max results set in component attribute
    searchHelper.paginateContentResults(contentSearch, customStartingPage, req.querystring.pageSize);

    res.render('experience/components/commerce_layouts/contentGrid', {
        contentSearch: contentSearch,
        customStartingPage: req.querystring.customStartingPage || 0,
        containerClass: req.querystring.containerClass || '',
        columnClass: req.querystring.columnClass || '',
        resultLimit: req.querystring.resultLimit,
        pageMax: req.querystring.pageSize
    });

    next();
});

module.exports = server.exports();
