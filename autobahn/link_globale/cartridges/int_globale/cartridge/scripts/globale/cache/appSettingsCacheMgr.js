'use strict';

/**
 * Returns cache object from custom object
 * @param {dw.object.CustomObjectMgr} co  - Custom object
 * @returns {Object} - cache object
 */
function getCacheObjectFromCO(co) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var result = {
        clientSettings: co.custom.clientSettings,
        serverSettings: co.custom.serverSettings,
        webClientVersion: co.custom.webClientVersion,
        apiVersion: co.custom.apiVersion
    };

    Object.keys(globaleHelpers.platformSettings).forEach(function (key) {
        if ((globaleHelpers.platformSettings[key] in co.custom)) {
            result[globaleHelpers.platformSettings[key]] = co.custom[key];
        }
    });

    return result;
}

/**
 * Returns cached value by key
 * @param {string} key - key
 * @returns {Object} - cached value
 */
function getCachedValue(key) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var cache = require('dw/system/CacheMgr').getCache(globaleHelpers.cacheKeys.appSettings);

    return cache.get(require('dw/system/Site').current.ID + '_' + key, function () {
        var co = CustomObjectMgr.getCustomObject(globaleHelpers.customObjectKeys.coAppSettings, key);
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
    return cacheHelpers.isEnabled(globaleHelpers.cacheKeys.appSettings);
}

module.exports = {
    getCachedValue: getCachedValue,
    isCacheEnabled: isCacheEnabled
};
