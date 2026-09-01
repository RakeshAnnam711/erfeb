'use strict';

/**
 * Sends request to Global-e in order to obtain API JWT.
 * @throws {Error} - if impossible to get API JWT
 * @returns {string} - API JWT
 */
function requestJwt() {
    var validator = require('*/cartridge/scripts/util/globale/validator');
    var geConfigurationMgr = require('*/cartridge/scripts/factories/globale/geConfigurationMgr');
    var JWT = require('*/cartridge/models/globale/jwt/JWT');

    var jwtApiAuthConfig = geConfigurationMgr.getJwtApiAuthConfig();
    var service = require('*/cartridge/scripts/factories/globale/geServiceMgr').getJWTService();

    // send request to Global-e
    var serviceResponse = service.call(JSON.stringify({
        username: jwtApiAuthConfig.getUsername(),
        password: jwtApiAuthConfig.getPassword()
    }));

    // check service response
    if (!serviceResponse.isOk()) {
        throw Error('Impossible to get API JWT');
    }

    // validate service response
    var responseObject = JSON.parse(serviceResponse.object.text);
    var responseValidationSchema = {
        Token: { required: true }
    };
    var responseValidationResult = validator.validate(responseObject, responseValidationSchema);
    if (!responseValidationResult.valid) {
        throw Error('Invalid API JWT response');
    }

    // validate JWT
    var apiJwt = new JWT(responseObject.Token);
    apiJwt.verify();

    return responseObject.Token;
}

/**
 * Returns JWT to sing API requests to Global-e
 * @throws {Error}
 * @param {boolean} forseRefresh - ignore stored token value
 * @returns {string} - API JWT
 */
function getAuthenticationToken(forseRefresh) {
    var CacheMgr = require('dw/system/CacheMgr');

    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var JWT = require('*/cartridge/models/globale/jwt/JWT');
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();

    try {
        // get JWT from storage (if exists)
        var geCacheStorage5 = CacheMgr.getCache(globaleHelpers.cacheKeys.geCacheStorage5);
        var cacheKey = 'geJWT_' + globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geClientJsMerchantId);

        var getRequestedJwtCached = function () {
            var token = requestJwt();
            geCacheStorage5.put(cacheKey, token);
            return token;
        };

        if (forseRefresh) {
            return getRequestedJwtCached();
        }

        var storedTokenValue = geCacheStorage5.get(cacheKey, function () {
            return requestJwt();
        });

        try {
            var storedJwt = new JWT(storedTokenValue);
            storedJwt.verify();
            return storedTokenValue;
        } catch (e) {
            geCacheStorage5.invalidate(cacheKey);
        }

        return getRequestedJwtCached();
    } catch (e) {
        logger.error('GLOBALE_JWT: {0}', logger.message(e));
        throw e;
    }
}

module.exports = {
    getAuthenticationToken: getAuthenticationToken
};
