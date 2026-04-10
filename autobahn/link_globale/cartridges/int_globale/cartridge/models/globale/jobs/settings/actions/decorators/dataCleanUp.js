'use strict';

/**
 * Cleans up redundant custom objects and caches
 * @param {string} objectType - custom object type
 * @param {Array} objectIdsToSkip - custom objects to skip
 * @param {string} keyAttribute - custom object keu attribute
 * @param {string} cacheId - SFCC custom cache ID to invalidate
 */
function dataCleanUp(objectType, objectIdsToSkip, keyAttribute, cacheId) {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');

    Transaction.wrap(function () {
        var geCOIterator = CustomObjectMgr.getAllCustomObjects(objectType);
        while (geCOIterator.hasNext()) {
            var co = geCOIterator.next();

            // remove redundant custom object
            if (objectIdsToSkip.indexOf(co.custom[keyAttribute]) === -1) {
                CustomObjectMgr.remove(co);
            }

            // invalidate cache
            require('*/cartridge/scripts/helpers/cacheHelpers')
                .invalidateCache(
                    cacheId,
                    require('dw/system/Site').current.ID + '_' + co.custom[keyAttribute]
                );
        }
        geCOIterator.close();
    });
}

module.exports = function (object) {
    Object.defineProperties(object, {
        dataCleanUp: {
            enumerable: true,
            value: dataCleanUp
        }
    });
};
