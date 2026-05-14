'use strict';

/**
 * Calculates Culture for Global-e SendCart API
 * @returns {Object} - Global-e SendCart.Culture API object
 */
function getCultureData() {
    var globaleSession = require('*/cartridge/models/globale/session');
    var globaleRequest = require('*/cartridge/models/globale/request');
    var globaleCulture = require('*/cartridge/models/globale/culture');

    // get checkout culture code
    var cultureCode = globaleCulture.getGlobaleCheckoutCultureCode(globaleSession.get('geCountry'), globaleRequest.get('locale'));

    return {
        CultureCode: cultureCode,
        InputDataCultureCode: cultureCode,
        PreferedCultureCode: cultureCode
    };
}

module.exports = function (object) {
    Object.defineProperty(object, 'getCultureData', {
        value: getCultureData
    });
};
