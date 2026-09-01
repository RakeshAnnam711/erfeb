'use strict';

const Resource = require('dw/web/Resource');

const paypalUtils = require('*/cartridge/scripts/paypal/utils');

/**
 * This function is to handle the post payment authorization customizations
 *
 * @param {Object} result - Authorization Result
 * @returns {Object} response {}
 */
function postAuthorization(result) {
    if (!result.error) {
        return {};
    }

    if (result.serverErrors) {
        paypalUtils.createErrorLog(result.serverErrors.join(' '));
    }

    const unprocessableEntityError = Resource.msg('paypal.error.unprocessable.entity', 'paypalerrors', null);

    const errorMessage = result.message === unprocessableEntityError
        ? Resource.msg('paypal.error.expiredCard', 'paypalerrors', null)
        : Resource.msg('paypal.error.general', 'paypalerrors', null);

    return {
        error: true,
        errorMessage: result.errorMessage || errorMessage
    };
}

exports.postAuthorization = postAuthorization;
