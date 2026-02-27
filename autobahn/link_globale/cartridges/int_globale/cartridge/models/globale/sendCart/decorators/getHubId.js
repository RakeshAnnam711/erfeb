'use strict';

/**
 * Returns HubId for Global-e SendCart API
 * @returns {number|null} - Global-e SendCart.HubId API object
 */
function getHubId() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    return globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.sendCart.getHubId);
}

module.exports = function (object) {
    Object.defineProperty(object, 'getHubId', {
        value: getHubId
    });
};
