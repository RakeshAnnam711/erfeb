'use strict';

/**
 * Returns Global-e Product.HubCode
 * @returns {string|null} - Global-e Product.HubCode
 */
function getHubCode() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    return globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.sendCart.getPliHubCode, this.productLineItem);
}

module.exports = function (object) {
    Object.defineProperty(object, 'getHubCode', {
        value: getHubCode
    });
};
