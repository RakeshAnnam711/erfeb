'use strict';

var objectUtils = require('*/cartridge/scripts/util/globale/object');

/**
 * Represents JWTAuthConfig
 * @constructor
 * @param {Object} config - config object
 */
function JWTAuthConfig(config) {
    /**
     * Is JWT Auth Enabled
     * @param {string} endpoint - endpoint
     * @returns {boolean} - enabled
     */
    this.isEnabled = function (endpoint) {
        var enabled = objectUtils.getValueByPath(config, 'enabled', false);
        var excludedEndpoints = objectUtils.getValueByPath(config, 'excludedEndpoints', []);

        return !!enabled && excludedEndpoints.indexOf(endpoint) === -1;
    };

    /**
     * Returns JWT Auth Public Key
     * @returns {string} - Public Key
     */
    this.getPublicKey = function () {
        return objectUtils.getValueByPath(config, 'publicKey', '');
    };

    /**
     * Returns JWT Auth Algorythm
     * @returns {string} - Algorythm
     */
    this.getAlgorythm = function () {
        return objectUtils.getValueByPath(config, 'algorythm', 'RS256');
    };

    /**
     * Returns JWT Auth Issuer
     * @returns {string} - Issuer
     */
    this.getIssuer = function () {
        return objectUtils.getValueByPath(config, 'issuer', '');
    };
}

module.exports = JWTAuthConfig;
