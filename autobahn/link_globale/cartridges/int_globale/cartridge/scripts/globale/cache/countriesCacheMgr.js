'use strict';

/**
 * Returns cache object from custom object
 * @param {dw.object.CustomObjectMgr} co  - Custom object
 * @returns {Object} - cache object
 */
function getCacheObjectFromCO(co) {
    return {
        code: co.custom.code,
        name: co.custom.name,
        siteUrl: co.custom.siteUrl,
        defaultCurrencyCode: co.custom.defaultCurrencyCode,
        useCountryVAT: co.custom.useCountryVAT,
        supportsFixedPrices: co.custom.supportsFixedPrices,
        isOperatedByGlobalE: co.custom.isOperatedByGlobalE,
        defaultVATRateType: co.custom.defaultVATRateType,
        countryCode3: co.custom.countryCode3,
        vatExemptionDisabled: co.custom.vatExemptionDisabled
    };
}

/**
 * Returns cached value by key
 * @param {string} key - key
 * @returns {Object} - cached value
 */
function getCachedValue(key) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var cache = require('dw/system/CacheMgr').getCache(globaleHelpers.cacheKeys.countries);

    return cache.get(require('dw/system/Site').current.ID + '_' + key, function () {
        var co = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coCountries, key);
        return co ? getCacheObjectFromCO(co) : null;
    });
}

/**
 * Checks if cache enabled
 * @returns {boolean} - cached enabled
 */
function isCacheEnabled() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var cacheHelpers = require('*/cartridge/scripts/helpers/cacheHelpers');
    return cacheHelpers.isEnabled(globaleHelpers.cacheKeys.countries);
}

module.exports = {
    getCachedValue: getCachedValue,
    isCacheEnabled: isCacheEnabled
};
