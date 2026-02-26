'use strict';

var server = require('server');

server.extend(module.superModule);

var URLUtils = require('dw/web/URLUtils');

server.append('Show', function (req, res, next) {
    var canonicalUrl = URLUtils.abs('Home-Show').toString();
    var breadcrumbHelpers = require('*/cartridge/scripts/helpers/breadcrumbHelpers');
    var viewData = res.getViewData() || {};

    // Working around for incorrect action path caused by server route module incorrectly applying Sites-[SiteID]-Site for current page Action (Controller and Endpoint)
    var viewDataAction = empty(viewData.action) || (viewData.action || '').replace(/[^\-]/gi, '').length !== 1 ? 'Home-Show' : viewData.action;

    canonicalUrl = viewData && viewData.siteContext && viewData.siteContext.url ? viewData.siteContext.url : URLUtils.abs('Home-Show').toString();

    res.setViewData({
        action: viewDataAction,
        canonicalUrl: canonicalUrl,
        breadcrumbs: breadcrumbHelpers.updateHomeURL(viewData)
    });

    next();
});

server.append('ErrorNotFound', function (req, res, next) {
    res.setStatusCode(410);
    next();
});

module.exports = server.exports();
