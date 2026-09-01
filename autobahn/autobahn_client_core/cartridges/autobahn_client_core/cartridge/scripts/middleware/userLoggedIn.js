'use strict';

var URLUtils = require('dw/web/URLUtils');

/**
 * Middleware validating if user logged in
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function validateLoggedIn(req, res, next) {
    if (!req.currentCustomer.profile) {
        if (req.querystring.args) {
            req.session.privacyCache.set('args', req.querystring.args);
        }
        res.redirect(URLUtils.url('Login-Show'));
        res.setRedirectStatus(301);
    }
    next();
}

/**
 * Middleware validating if user logged in from ajax request
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function validateLoggedInAjax(req, res, next) {
    if (!req.currentCustomer.profile) {
        if (req.querystring.args) {
            req.session.privacyCache.set('args', req.querystring.args);
        }
        res.setStatusCode(500);
        res.setViewData({
            loggedin: false,
            redirectUrl: URLUtils.url('Login-Show').toString()
        });
        res.setRedirectStatus(301);
    } else {
        res.setViewData({
            loggedin: true
        });
    }
    next();
}

module.exports = {
    validateLoggedIn: validateLoggedIn,
    validateLoggedInAjax: validateLoggedInAjax
};
