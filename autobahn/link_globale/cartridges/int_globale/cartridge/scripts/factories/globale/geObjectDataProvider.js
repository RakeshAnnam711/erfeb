'use strict';

/**
 * Represents a COProvider.
 * @constructor
 * @param {string} customObjectType - custom object type
 */
function COProvider(customObjectType) {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var geCustomObjectType = customObjectType;
    this.getGEObject = function (key) {
        return CustomObjectMgr.getCustomObject(geCustomObjectType, key);
    };
}

/**
 * Represents a CacheProvider.
 * @constructor
 * @param {Object} cacheMgr - cache manager
 */
function CacheProvider(cacheMgr) {
    var geCacheMgr = cacheMgr;
    this.getGEObject = function (key) {
        var cachedValue = geCacheMgr.getCachedValue(key);
        var result = null;

        if (cachedValue) {
            result = {
                custom: cachedValue,
                getCustom: function () {
                    return this.custom;
                }
            };
        }
        return result;
    };
}

/**
 * Creates COProvider
 * @param {Object} cacheMgr - cache manager
 * @param {string} customObjectType - custom object type
 * @returns {COProvider} - COProvider instance
 */
function createDataProvider(cacheMgr, customObjectType) {
    return cacheMgr.isCacheEnabled() ? (new CacheProvider(cacheMgr)) : (new COProvider(customObjectType));
}

module.exports = {
    createDataProvider: createDataProvider
};
