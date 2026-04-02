'use strict';

var server = require('server');
server.extend(module.superModule);

server.replace('Start', function (req, res, next) {
    var URLRedirectMgr = require('dw/web/URLRedirectMgr');
    var URLUtils = require('dw/web/URLUtils');
    var redirect = URLRedirectMgr.redirect;
    var location = redirect ? redirect.location : null;
    var redirectStatus = redirect ? redirect.getStatus() : null;
    var path = URLRedirectMgr.redirectOrigin;

    path = path.replace(/\?.*$/gi, '');

    //if there is a page and it is visible for this locale/site
    if (!!location && path === '/') {
        var viewData = res.getViewData();

        location = URLUtils.home().toString();
        location += (location.indexOf('?') === -1 ? '?' : '&') + viewData.queryString;
    }

    // Apply default very short cache for non-match redirect
    res.cachePeriod = 5;
    res.cachePeriodUnit = 'minutes';

    if (!location) {
        res.setStatusCode(404);
        res.render('error/notFound');
    } else {
        // Increase cache for found redirects
        res.cachePeriod = 360;
        res.cachePeriodUnit = 'hours';

        if (redirectStatus) {
            res.setRedirectStatus(redirectStatus);
        }
        res.redirect(location);
    }

    // Fallback to SFRA behavior
    next();
});

module.exports = server.exports();
