'use strict';

/**
 * Returns cookie consent
 * 0 - No consent
 * 1 - Consent to all cookies
 * 2 - Consent to the essential cookies only
 * @returns {string} - Global-e WebStoreCode
 */
function getCookieConsent() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    return globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.sendCart.getCookieConsent) || 0;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        getCookieConsent: {
            value: getCookieConsent
        }
    });
};
