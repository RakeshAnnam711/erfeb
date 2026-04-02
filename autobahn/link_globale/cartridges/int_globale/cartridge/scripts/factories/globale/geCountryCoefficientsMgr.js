'use strict';

/**
 * Returns Global-E CountryCoefficients object
 * @param {string} countryCode - country code
 * @returns {dw.object.CustomObject|Object} - CountryCoefficients object
 */
function getGECountryCoefficients(countryCode) {
    var Logger = require('dw/system/Logger');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geObjectDataProvider = require('*/cartridge/scripts/factories/globale/geObjectDataProvider');
    var result = null;

    try {
        var provider = geObjectDataProvider.createDataProvider(
            require('*/cartridge/scripts/globale/cache/countryCoefficientsCacheMgr'),
            globaleHelpers.customObjectKeys.coCountryCoefficients
        );
        result = provider.getGEObject(countryCode);
    } catch (e) {
        Logger.getLogger('GLOBALE').error('geCountryCoefficientsMgr: was not able to get Global-E object. Error: ' + e.message);
        throw e;
    }

    return result;
}

module.exports = {
    getGECountryCoefficients: getGECountryCoefficients
};
