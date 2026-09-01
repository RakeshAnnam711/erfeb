'use strict';

/**
 * Middleware to parse req.body
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {undefined|Function} Returns the next middleware function if parsing is successful
 */
function parseBody(req, res, next) {
    try {
        res.parsedBody = req.body && JSON.parse(req.body);
    } catch (err) {
        const responseHelper = require('*/cartridge/scripts/helpers/responseHelper');

        responseHelper.handleControllerError(err, res, 500);

        return undefined;
    }

    return next();
}

module.exports = { parseBody: parseBody };
