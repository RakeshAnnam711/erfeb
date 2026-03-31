'use strict';

var server = require('server');
server.extend(module.superModule);

var CatalogMgr = require('dw/catalog/CatalogMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');
var URLRedirectMgr = require('dw/web/URLRedirectMgr');
var URLUtils = require('dw/web/URLUtils');

var cache = require('*/cartridge/scripts/middleware/cache');

server.prepend('Start', function (req, res, next) {
    var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
    var pathInfoHeader = req.httpHeaders['x-is-path_info'];
    var origin = URLRedirectMgr.getRedirectOrigin();
 
    if (pathInfoHeader && pathInfoHeader === '/.well-known/apple-developer-merchantid-domain-association') {
        var applePayDomainAssociation =  AdyenConfigs.getApplePayDomainAssociation();
        res.setHttpHeader(response.CONTENT_TYPE, 'text/plain');
        response.getWriter().print(applePayDomainAssociation)
        return;
    }
 
    var path = URLRedirectMgr.redirectOrigin;
    var location;

    path = path.replace(/\?.*$/gi, '').split('/').pop();
    // Pull final dash element remove
    var pid = path.replace(/\..*$/gi, '').toUpperCase().split('-');
    if (pid.length > 0) {
        var newPID = pid[pid.length-1];
        var product = ProductMgr.getProduct(newPID);
        if (product) {
            location = URLUtils.https('Product-Show','pid',newPID).toString();
        }
    }

    var newCategoryID = path.split('?')[0].split('/').pop();
    var category = CatalogMgr.getCategory(newCategoryID);
    if (category) {
        location = URLUtils.https('Search-Show','cgid', newCategoryID).toString();
    }

    if (!empty(location)) {
        // Increase cache for found redirects
        res.cachePeriod = 360;
        res.cachePeriodUnit = 'hours';

        res.redirect(location);
    }
    next();
});

server.append('Start', function (req, res, next) {
    var URLRedirectMgr = require('dw/web/URLRedirectMgr');

    var redirect = URLRedirectMgr.redirect;
    var location = redirect ? redirect.location : null;
    var path = URLRedirectMgr.redirectOrigin;

    if (!location && path && path.length > 1) {
        var URLUtils = require('dw/web/URLUtils');
        var ProductMgr = require('dw/catalog/ProductMgr');
        var querystring = path.split('?')[1] || '';

        // Reset path string to final path element
        path = path.split('?')[0].split('/').pop();

        // Pull final dash element remove
        var pid = path.replace(/\..*$/gi, '').toUpperCase().split('-');

        while (pid.length > 0) {
            var newPID = pid.join('-');
            var product = ProductMgr.getProduct(newPID);

            if (product && !location) {
                location = URLUtils.https('Product-Show','pid',newPID).toString();
                res.redirect(location);
                res.setRedirectStatus(301);
            }

            // Remove begining element
            pid = pid.slice(1);
        }
    }

    // Fallback if redirect was not found
    this.on('route:BeforeComplete', function (req, res) {
        res.redirect(URLUtils.home());
        res.setRedirectStatus(301);
    });

    // Fallback to SFRA behavior
    next();
});

server.get('LOA', server.middleware.https, cache.applyDefaultCache, function (req, res, next) {
    var currentSite = Site.getCurrent();
    var redirectDomainPath = currentSite.getCustomPreferenceValue('loaRedirectDomainPath');
    var redirectStatus = currentSite.getCustomPreferenceValue('loaRedirectStatus');

    var path = req.querystring.path;
    var location = redirectDomainPath + path;
    res.redirect(location, redirectStatus);

    next();
});

module.exports = server.exports();
