'use strict';

/**
 * Returns cache object from custom object
 * @param {dw.object.CustomObjectMgr} co  - Custom object
 * @returns {Object} - cache object
 */
function getCacheObjectFromCO(co) {
    return {
        productClassCode: co.custom.productClassCode,
        countryCode: co.custom.countryCode,
        rate: co.custom.rate
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
    var cache = require('dw/system/CacheMgr').getCache(globaleHelpers.cacheKeys.productClassCoefficients);

    return cache.get(require('dw/system/Site').current.ID + '_' + key, function () {
        var co = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coProductClassCoefficients, key);
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
    return cacheHelpers.isEnabled(globaleHelpers.cacheKeys.productClassCoefficients);
}

module.exports = {
    getCachedValue: getCachedValue,
    isCacheEnabled: isCacheEnabled
};
