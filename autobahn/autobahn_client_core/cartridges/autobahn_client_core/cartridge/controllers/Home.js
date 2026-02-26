'use strict';

var server = require('server');
server.extend(module.superModule);

var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');

server.append('Show', function (req, res, next) {
    var viewData = res.getViewData() || {};

    let computedMetaData = {
        title: req.pageMetaData.title,
        description: req.pageMetaData.description,
        keywords: req.pageMetaData.keywords,
        robots:'index,follow', // WGACA Custom prop, Not recommended by RVW
        pageMetaTags: []
    };

    // rvw_pagedesigner_core migration
    var currentCustomer = req.currentCustomer;
    var currentCustomerRawID = currentCustomer.raw.ID;
    session.custom.currentCustomer = currentCustomerRawID;

    var canonicalUrl;
    try {
        // Include locale for canonical URLs on homepage if request contains locale info
        var pathInfo = req.httpHeaders.get('x-is-path_info') || '';
        var siteContextUrl = viewData && viewData.siteContext && viewData.siteContext.url;
        canonicalUrl = (pathInfo === '/' && siteContextUrl) ? siteContextUrl : URLUtils.abs('Home-Show').toString();
    } catch (e) {
        Logger.error('Error computing canonicalUrl: {0}', e.message);
        canonicalUrl = URLUtils.abs('Home-Show').toString();
    }

    var FrenzyCustomerData = {
        authenticated: !!req.currentCustomer.profile,
        profile: req.currentCustomer.profile || null
    }

    res.setViewData({
        currentCustomer: currentCustomer,
        canonicalUrl: canonicalUrl,
        CurrentCustomer: FrenzyCustomerData,
        CurrentPageMetaData: computedMetaData
    });

    next();
});

module.exports = server.exports();
