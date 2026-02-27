/* globals request */

'use strict';

/**
 * Sets locale
 * @param {string|undefined|null} localeId - Locale ID
 * @returns {dw.system.Status} - operation status
 */
function setLocale(localeId) {
    var Locale = require('dw/util/Locale');
    var Status = require('dw/system/Status');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();

    try {
        if (localeId) {
            var locale = Locale.getLocale(localeId);
            if (locale) {
                request.setLocale(localeId);
                logger.info('Locale was changed to: {0}', localeId);
            }
        }
    } catch (e) {
        return new Status(Status.ERROR, '100', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperties(object, {
        setLocale: {
            enumerable: true,
            value: setLocale
        }
    });
};
