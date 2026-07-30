'use strict';

// Local cache
var geForbidden = {};
var geRestricted = {};

/**
 * Sets product restrictions cache
 * @param {string} countryCode - Global-e Country Code
 * @returns {void}
 */
function setGeRestrictionsCache(countryCode) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var product = this;
    var geRestrictionsKey = [product.ID + '_' + countryCode];
    var restrSeparator = ',';

    if (!(geRestrictionsKey in geForbidden) || geForbidden[geRestrictionsKey] === undefined) {
        geForbidden[geRestrictionsKey] = !!(product.custom[globaleHelpers.customAttr.product.geIsForbidden]);
    }
    if (!(geRestrictionsKey in geRestricted) || geRestricted[geRestrictionsKey] === undefined) {
        geRestricted[geRestrictionsKey] = product.custom[globaleHelpers.customAttr.product.geRestrictedCountries] &&
            product.custom[globaleHelpers.customAttr.product.geRestrictedCountries].split(restrSeparator).indexOf(countryCode) >= 0;
    }
}

/**
 * Checks if product restricted
 * @param {string} countryCode - Global-e Country Code
 * @returns {boolean} - product restricted
 */
function isGeRestricted(countryCode) {
    var product = this;
    var geRestrictionsKey = [product.ID + '_' + countryCode];
    var result = false;

    // set local cache
    setGeRestrictionsCache.apply(product, Array.prototype.slice.call(arguments));

    // check if product restricted
    if (geForbidden[geRestrictionsKey]) {
        result = true;
    } else if (geRestricted[geRestrictionsKey]) {
        result = true;
    }

    return result;
}

/**
 * Gets product restrictions message
 * @param {string} countryCode - Global-e Country Code
 * @returns {string|null} - product restrictions message
 */
function getGeRestrictionMessage(countryCode) {
    var Resource = require('dw/web/Resource');
    var product = this;
    var geRestrictionsKey = [product.ID + '_' + countryCode];
    var result = null;

    // set local cache
    setGeRestrictionsCache.apply(product, Array.prototype.slice.call(arguments));

    // check if product restricted
    if (geForbidden[geRestrictionsKey]) {
        result = Resource.msg('product.forbidden', 'globale', null);
    } else if (geRestricted[geRestrictionsKey]) {
        result = Resource.msg('product.restricted', 'globale', null);
    }

    return result;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        isGeRestricted: {
            value: isGeRestricted
        },
        getGeRestrictionMessage: {
            value: getGeRestrictionMessage
        }
    });
};
