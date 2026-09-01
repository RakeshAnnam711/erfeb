'use strict';

const csrfProtection = require('dw/web/CSRFProtection');
const Resource = require('dw/web/Resource');

/**
 * Middleware validating CSRF token
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function validateRequest(req, res, next) {
    if (!csrfProtection.validateRequest()) {
        res.setStatusCode(400);

        res.json({
            error: true,
            message: Resource.msg('error.csrf.token.mismatch', 'errors', null)
        });

        return;
    }

    next();
}

/**
 * Middleware generating a CSRF token and setting the view data. Only executes if a CSRF token is not already on the view data.
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function generateToken(req, res, next) {
    // The consent tracking middleware calls this method because it requires a CSRF token.
    // It didn't always require a CSRF token, so it is commonly listed alongside this middleware,
    // rather than used exclusively. The order in which the two methods are executed is not
    // guaranteed, so both methods check for the existence of `csrf` on the view data to avoid
    // unnecessary work.
    const viewData = res.getViewData();

    if (!viewData.csrf) {
        res.setViewData({
            csrf: {
                tokenName: csrfProtection.getTokenName(),
                token: csrfProtection.generateToken()
            }
        });
    }

    next();
}

module.exports = {
    validateRequest: validateRequest,
    generateToken: generateToken
};
