'use strict';

/**
 * Returns cache object from custom object
 * @param {dw.object.CustomObjectMgr} co  - Custom object
 * @returns {Object} - cache object
 */
function getCacheObjectFromCO(co) {
    return {
        hubID: co.custom.hubID,
        hubName: co.custom.hubName,
        stateOrProvice: co.custom.stateOrProvice,
        city: co.custom.city,
        zip: co.custom.zip,
        address1: co.custom.address1,
        address2: co.custom.address2,
        phone1: co.custom.phone1,
        phone2: co.custom.phone2,
        fax: co.custom.fax,
        email: co.custom.email,
        countryCode: co.custom.countryCode,
        countryName: co.custom.countryName,
        stateCode: co.custom.stateCode
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
    var cache = require('dw/system/CacheMgr').getCache(globaleHelpers.cacheKeys.hubDetails);

    return cache.get(require('dw/system/Site').current.ID + '_' + key, function () {
        var co = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coHubDetails, key);
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
    return cacheHelpers.isEnabled(globaleHelpers.cacheKeys.hubDetails);
}

module.exports = {
    getCacheObjectFromCO: getCacheObjectFromCO,
    getCachedValue: getCachedValue,
    isCacheEnabled: isCacheEnabled
};
