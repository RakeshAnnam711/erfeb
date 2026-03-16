'use strict';

var server = require('server');

server.extend(module.superModule);

var PageMgr = require('dw/experience/PageMgr');
var URLUtils = require('dw/web/URLUtils');

var cache = require('*/cartridge/scripts/middleware/cache');

var middlewareChromeless = function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) {
        var isAjax = !!req.querystring.isAjax || req.includeRequest; // pass an isAjax flag to fetch chromeless Page Designer pages via ajax
        var rendering = (res.renderings || []).find(function (rendering) { return rendering.type === 'render' });

        // Prevent page cache for Page Desinger includes as ServerJS runs PD through __SYSTEM-... includes (specialized cache)
        if (rendering && rendering.subType === 'page' && !empty(rendering.page)) {
            var page = PageMgr.getPage(rendering.page);

            if (page.getAttribute('chromeless') && !isAjax) {
                res.redirect(URLUtils.url('Home-Show'));
            }
        }
    });

    next();
};

/*
 * Custom Page-Include for content assets
 */
server.append('Include', middlewareChromeless, function (req, res, next) {
    if (req.querystring.cid) {
        var viewData = res.getViewData();
        var bid = viewData.abConfigs && !empty(viewData.abConfigs.brandID) ? ('_' + viewData.abConfigs.brandID) : '';
        var apiPage;

        [req.querystring.cid + bid, req.querystring.cid].forEach(pageID => {
            var page = empty(apiPage) && PageMgr.getPage(pageID);
            // Only update if prev id empty or invisible, otherwise reset
            apiPage = (page || {}).visible ? page : apiPage;
        });

        // if there is a page and it is visible for this locale/site
        if (!empty(apiPage)) {
            res.page(apiPage.ID);
        }
    }

    next();
});

server.append('Show', function (req, res, next) {
    if (req.querystring.cid) {
        var viewData = res.getViewData();
        var bid = req.querystring.ajaxRegion !== 'belowFold' && viewData.abConfigs && !empty(viewData.abConfigs.brandID) ? ('_' + viewData.abConfigs.brandID) : '';
        var apiPage;

        [req.querystring.cid + bid, req.querystring.cid].forEach(pageID => {
            var page = empty(apiPage) && PageMgr.getPage(pageID);
            // Only update if prev id empty or invisible, otherwise reset
            apiPage = (page || {}).visible ? page : apiPage;
        });

        // if there is a page and it is visible for this locale/site
        if (!empty(apiPage)) {
            res.page(apiPage.ID);
        }
    }

    next();
});

module.exports = server.exports();
