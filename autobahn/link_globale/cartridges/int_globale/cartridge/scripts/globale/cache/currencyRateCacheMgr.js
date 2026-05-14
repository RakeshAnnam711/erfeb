'use strict';

/**
 * Returns cache object from custom object
 * @param {dw.object.CustomObjectMgr} co  - Custom object
 * @returns {Object} - cache object
 */
function getCacheObjectFromCO(co) {
    return {
        targetCurrencyCode: co.custom.targetCurrencyCode,
        sourceCurrencyCode: co.custom.sourceCurrencyCode,
        rate: co.custom.rate,
        rateData: co.custom.rateData
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
    var cache = require('dw/system/CacheMgr').getCache(globaleHelpers.cacheKeys.currencyRates);

    return cache.get(require('dw/system/Site').current.ID + '_' + key, function () {
        var co = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coCurrencyRates, key);
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
    return cacheHelpers.isEnabled(globaleHelpers.cacheKeys.currencyRates);
}

module.exports = {
    getCachedValue: getCachedValue,
    isCacheEnabled: isCacheEnabled
};
