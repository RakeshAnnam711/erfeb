'use strict';

/**
 * Returns AllowMailsFromMerchant for Global-e SendCart API
 * @returns {boolean} - Global-e SendCart.AllowMailsFromMerchant API
 */
function getAllowMailsFromMerchant() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    return globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.sendCart.getAllowMailsFromMerchant);
}

module.exports = function (object) {
    Object.defineProperty(object, 'getAllowMailsFromMerchant', {
        value: getAllowMailsFromMerchant
    });
};
