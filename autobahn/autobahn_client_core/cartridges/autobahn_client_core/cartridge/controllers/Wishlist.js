'use strict';

/**
 * Controller that enhance the Wishlist controller with SEO data
 *
 * @module controllers/Wishlist
 */

var server = require('server');
server.extend(module.superModule);

var URLUtils = require('dw/web/URLUtils');

/**
 * Endpoints
 */
server.append('Show', function (req, res, next) {
    res.setViewData({
        canonicalUrl: URLUtils.abs('Wishlist-Show').toString()
    });
    next();
});

module.exports = server.exports();
