'use strict';

/**
 * Returns Global-E cache settings
 * @returns {Object} - Global-E cache settings
 */
function getSettings() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var settings = globaleHelpers.getJSONPreference(globaleHelpers.preferenceKeys.geCustomObjectsCacheSettings) || {};
    return settings;
}

/**
 * Checks if Global-E custom objects cache enabled
 * @param {string} geCacheId - Global-e cache ID
 * @returns {boolean} - Global-E cache enabled
 */
function isEnabled(geCacheId) {
    var cacheSettings = getSettings();
    var result = true;
    if ((geCacheId in cacheSettings) && cacheSettings[geCacheId] === false) {
        result = false;
    }
    return result;
}

/**
 * Invalidates SFCC custom cache
 * @param {string} cacheId - cache ID
 * @param {string} cacheKey - cache key
 */
function invalidateCache(cacheId, cacheKey) {
    try {
        var cache = require('dw/system/CacheMgr').getCache(cacheId);
        cache.invalidate(cacheKey);
    } catch (e) {
        // skip exception handling
    }
}

module.exports = {
    getSettings: getSettings,
    isEnabled: isEnabled,
    invalidateCache: invalidateCache
};
