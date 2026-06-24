'use strict';

var AbstractRequest = require('*/cartridge/models/globale/generic/AbstractRequest');

/**
 * Represents abstract Global-e request
 * @constructor
 */
function AbstractGeRequest() {
    AbstractRequest.call(this);
}

/* Inherits AbstractRequest */
AbstractGeRequest.prototype = Object.create(AbstractRequest.prototype);

/**
 * Performs JWT authentication
 * @throws {Error}
 */
AbstractGeRequest.prototype.jwtAuth = function () {
    var System = require('dw/system/System');
    var geConfigurationMgr = require('*/cartridge/scripts/factories/globale/geConfigurationMgr');
    var globaleRequest = require('*/cartridge/models/globale/request');
    var geJwtMgr = require('*/cartridge/scripts/factories/globale/geJwtMgr');

    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var jwtAuthConfig = geConfigurationMgr.getJwtAuthConfig();

    try {
        if (jwtAuthConfig.isEnabled(globaleRequest.getRequestEndpoint())) {
            var httpHeaders = globaleRequest.get('httpHeaders');
            var authHeader = httpHeaders.get('Authorization') || httpHeaders.get('authorization') || '';

            // check auth header
            if (!authHeader) {
                throw Error('Authentication header is missing');
            }

            // check if basic auth used instead
            if (!authHeader.indexOf('Bearer') === 0) {
                throw Error('Bearer is missing');
            }

            // check public key, if empty - skip validation
            var jwtPublicKey = jwtAuthConfig.getPublicKey();
            if (!jwtPublicKey) {
                throw Error('JWT configuration issue');
            }

            // check JWT
            geJwtMgr.verify(authHeader, jwtPublicKey, {
                algorithm: jwtAuthConfig.getAlgorythm(),
                issuer: jwtAuthConfig.getIssuer()
            });
        }
    } catch (e) {
        // hide real error in the production environment
        if (System.instanceType === System.PRODUCTION_SYSTEM) {
            logger.error('GLOBALE_JWT_AUTH: {0}', logger.message(e));
            throw Error('JWT Auth required.');
        }

        throw e;
    }
};

module.exports = AbstractGeRequest;
