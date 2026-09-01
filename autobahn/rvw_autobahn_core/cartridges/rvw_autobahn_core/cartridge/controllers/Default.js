'use strict';

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');

/** when sitepath is defined in the site aliases from business manager, homepage will be redirected to maximize cached server response  */
server.replace('Start', cache.applyDefaultCache, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var location = URLUtils.httpsHome().toString();
    var query = req.querystring.toString() || '';

    if (query.length > 0) {
        location += location.indexOf('?') !== -1 ? '&' : '?';

        location += req.querystring.toString();
    }

    res.redirect(location);
    next();
});

module.exports = server.exports();
