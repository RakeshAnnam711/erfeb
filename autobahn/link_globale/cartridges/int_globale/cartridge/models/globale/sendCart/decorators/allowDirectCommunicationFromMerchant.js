'use strict';

/**
 * Returns AllowDirectCommunicationFromMerchant for Global-e SendCart API
 * @returns {boolean} - Global-e SendCart.AllowDirectCommunicationFromMerchant API
 */
function getAllowDirectCommunicationFromMerchant() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    return globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.sendCart.getAllowDirectCommunicationFromMerchant);
}

module.exports = function (object) {
    Object.defineProperty(object, 'getAllowDirectCommunicationFromMerchant', {
        value: getAllowDirectCommunicationFromMerchant
    });
};
