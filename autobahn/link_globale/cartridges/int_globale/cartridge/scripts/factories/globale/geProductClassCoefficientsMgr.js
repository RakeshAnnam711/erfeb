'use strict';

/**
 * Returns Global-E ProductClassCoefficient object
 * @param {string} key - ProductClassCoefficient key
 * @returns {dw.object.CustomObject|Object} - ProductClassCoefficient object
 */
function getGEProductClassCoefficient(key) {
    var Logger = require('dw/system/Logger');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geObjectDataProvider = require('*/cartridge/scripts/factories/globale/geObjectDataProvider');
    var result = null;

    try {
        var provider = geObjectDataProvider.createDataProvider(
            require('*/cartridge/scripts/globale/cache/productClassCoefficientsCacheMgr'),
            globaleHelpers.customObjectKeys.coProductClassCoefficients
        );
        result = provider.getGEObject(key);
    } catch (e) {
        Logger.getLogger('GLOBALE').error('geProductClassCoefficientsMgr: was not able to get Global-E object. Error: ' + e.message);
        throw e;
    }

    return result;
}

module.exports = {
    getGEProductClassCoefficient: getGEProductClassCoefficient
};
