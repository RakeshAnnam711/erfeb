'use strict';

/**
 * Calculates and returns Global-e Product Image URL API
 * @returns {string} - Global-e Product Image URL API
 */
function getProductImageUrl() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    return globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.getProductImageUrl, this.apiProduct);
}

module.exports = function (object) {
    Object.defineProperty(object, 'getProductImageUrl', {
        value: getProductImageUrl
    });
};
