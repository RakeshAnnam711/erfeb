'use strict';

/**
 * Handles errors that occur within a controller by logging the error and sending a JSON response with the error details.
 *
 * @param {Error} error - The error object caught in the controller.
 * @param {Object} res - The response object provided by the server environment.
 * @param {number} errorCode - The HTTP status code to be set on the response.
 */
function handleControllerError(error, res, errorCode) {
    const paypalUtils = require('*/cartridge/scripts/paypal/utils');

    res.setStatusCode(errorCode);

    error.name = Object.getPrototypeOf(error).name;
    paypalUtils.createErrorLog(JSON.stringify(error, null, 4));

    res.json({
        error: true,
        message: error.message
    });
}

module.exports = {
    handleControllerError: handleControllerError
};
