'use strict';

/**
 * Checks whether 'en' locale present in the settings of the current Site and returns the exact locale code.
 * @returns {string|null} - 'en' locale
 */
function getEnglishLocale() {
    var Site = require('dw/system/Site');
    var Locale = require('dw/util/Locale');
    var collections = require('*/cartridge/scripts/util/globale/collections');
    var locales = Site.current.getAllowedLocales();
    var enLocale = null;
    collections.find(locales, function (localeCode) {
        var locale = Locale.getLocale(localeCode);
        if (locale && locale.language === 'en') {
            enLocale = locale;
            return true;
        }
        return false;
    });

    // if there is no "English" locale use a default one
    if (!enLocale) {
        enLocale = Locale.getLocale(Site.current.getDefaultLocale());
    }

    return enLocale.ID;
}

/**
 * Calculates and returns User Locale (current request Locale)
 * @returns {string} - User Locale
 */
function getUserLocale() {
    var globaleRequest = require('*/cartridge/models/globale/request');
    return globaleRequest.get('locale');
}

module.exports = function (object) {
    Object.defineProperties(object, {
        englishLocale: {
            enumerable: true,
            value: getEnglishLocale()
        },
        userLocale: {
            enumerable: true,
            value: getUserLocale()
        }
    });
};
