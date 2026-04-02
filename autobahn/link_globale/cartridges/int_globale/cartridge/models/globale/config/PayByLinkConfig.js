'use strict';

var objectUtils = require('*/cartridge/scripts/util/globale/object');

/**
 * Represents PayByLinkConfig
 * @constructor
 * @param {Object} config - config object
 */
function PayByLinkConfig(config) {
    /**
     * Returns Text Resources IDs
     * @returns {Object} - Resources
     */
    this.getResources = function () {
        return objectUtils.getValueByPath(config, 'resources', {});
    };

    /**
     * Returns Auto-Fail Orders Time (minutes)
     * @returns {string} - Auto-Fail Orders Time
     */
    this.getAutoCancelOrdersTime = function () {
        return objectUtils.getValueByPath(config, 'autoCancelOrdersTime', '');
    };

    /**
     * Is Pay By Link Enabled
     * @returns {boolean} - enabled
     */
    this.isEnabled = function () {
        return objectUtils.getValueByPath(config, 'enabled', false);
    };
}

module.exports = PayByLinkConfig;
