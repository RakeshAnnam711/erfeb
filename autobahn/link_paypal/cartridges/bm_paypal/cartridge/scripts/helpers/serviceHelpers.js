'use strict';

/**
 * Handles error response, logs appropriate message and throws an error.
 * @param {Object} errorResponse Information about error response.
 * @param {Object} requestData Information about request data.
 */
function errorHandler(errorResponse, requestData) {
    const Resource = require('dw/web/Resource');

    const constants = require('~/cartridge/config/constants');
    const bmUtils = require('~/cartridge/scripts/paypal/utils');

    if (!errorResponse.errorMessage) {
        bmUtils.createErrorLog(Resource.msgf('service.wrongendpoint', 'paypalerrors', null, requestData.path));

        throw new Error();
    }

    const errorData = JSON.parse(errorResponse.errorMessage);

    let errorName;
    let errorDescription;

    // For type error ex -> {"error", "error_description"}
    if (errorData.error) {
        errorName = errorData.error;
        errorDescription = errorData.error_description;
    } else {
        const coreHelpers = require('~/cartridge/scripts/helpers/coreHelpers');

        // For error details with issue -> {"name", "message", "details": [{"issue", "description"}]}
        errorName = coreHelpers.getValueByKey(errorData, 'details.0.issue', errorData.name);
        errorDescription = coreHelpers.getValueByKey(errorData, 'details.0.description', errorData.message);
    }

    if (errorName.toLowerCase() === constants.INVALID_CLIENT) {
        bmUtils.createErrorLog(Resource.msgf('service.wrongcredentials', 'paypalbm', null, constants.SERVICE_NAME));
    }

    // Does not log errors with general informational value
    if (!constants.ERRORS_WHITE_LIST.includes(errorName)) {
        bmUtils.createErrorLog(errorDescription);
    }

    throw new Error(errorDescription);
}

module.exports = {
    errorHandler: errorHandler
};
