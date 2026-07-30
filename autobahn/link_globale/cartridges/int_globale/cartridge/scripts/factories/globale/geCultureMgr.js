'use strict';

/**
 * Returns Global-E object
 * @param {string} key - object key
 * @returns {dw.object.CustomObject|Object} - Global-E object
 */
function getGlobaleObject(key) {
    var Logger = require('dw/system/Logger');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geObjectDataProvider = require('*/cartridge/scripts/factories/globale/geObjectDataProvider');
    var result = null;

    try {
        var provider = geObjectDataProvider.createDataProvider(
            require('*/cartridge/scripts/globale/cache/cultureCacheMgr'),
            globaleHelpers.customObjectKeys.coCultures
        );
        result = provider.getGEObject(key);
    } catch (e) {
        Logger.getLogger('GLOBALE').error('geCultureMgr: was not able to get Global-E object. Error: ' + e.message);
        throw e;
    }

    return result;
}

module.exports = {
    getGECulture: getGlobaleObject
};
