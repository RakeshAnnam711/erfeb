'use strict';

/**
 * Returns AuthToken for Global-e SendCart API
 * @returns {string|null} - AuthToken value or null
 */
function getAuthToken() {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');
    var globaleCrypto = require('*/cartridge/scripts/factories/globale/crypto');

    // return null if there is not OCAPI/SCAPI request
    if (globaleRequest.get('clientId') === null) {
        return null;
    }

    // get authToken
    var authToken = globaleCAPIHelpers.getCAPIRequestAuthToken();
    if (authToken) {
        var geCrypto = globaleCrypto.getAESCrypto();
        authToken = geCrypto.encrypt(authToken);
    }

    return authToken;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getAuthToken', {
        value: getAuthToken
    });
};
