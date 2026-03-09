'use strict';

/**
 * Returns SessionId for Global-e SendCart API
 * @returns {string|null} - SessionId value or null
 */
function getSessionId() {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var globaleCAPIHelpers = require('*/cartridge/scripts/helpers/globaleCAPIHelpers');
    var globaleCrypto = require('*/cartridge/scripts/factories/globale/crypto');

    // return null if there is OCAPI/SCAPI request
    if (globaleRequest.get('clientId') !== null) {
        return null;
    }

    // get sessionId
    var sessionId = globaleCAPIHelpers.getCAPISerializedSessionId(this.basket.getCustomer());
    if (sessionId) {
        var geCrypto = globaleCrypto.getAESCrypto();
        sessionId = geCrypto.encrypt(sessionId);
    }

    return sessionId;
}

module.exports = function (object) {
    Object.defineProperty(object, 'getSessionId', {
        value: getSessionId
    });
};
