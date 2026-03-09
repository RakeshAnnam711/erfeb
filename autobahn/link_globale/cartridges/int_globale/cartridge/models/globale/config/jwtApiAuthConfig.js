'use strict';

var objectUtils = require('*/cartridge/scripts/util/globale/object');

/**
 * Represents JwtApiAuthConfig
 * @constructor
 * @param {Object} config - config object
 */
function JwtApiAuthConfig(config) {
    /**
     * Returns JWT Auth Username
     * @returns {string} - Username
     */
    this.getUsername = function () {
        return objectUtils.getValueByPath(config, 'username', '');
    };

    /**
     * Returns JWT Auth Password
     * @returns {string} - Password
     */
    this.getPassword = function () {
        return objectUtils.getValueByPath(config, 'password', '');
    };

    this.isServiceAuthEnabled = function (endpoint) {
        var enabled = objectUtils.getValueByPath(config, 'enabled', false);

        if (!enabled) {
            return false;
        }

        var enabledForEndpoints = objectUtils.getValueByPath(config, 'endpoints', []);
        return enabledForEndpoints.indexOf(endpoint) !== -1;
    };
}

module.exports = JwtApiAuthConfig;
