'use strict';

var AbstractConfig = require('*/cartridge/models/globale/config/AbstractConfig');
var objectUtils = require('*/cartridge/scripts/util/globale/object');
var memoizationUtils = require('*/cartridge/scripts/util/globale/memoization');

/**
 * Represents LanguageSwitcherConfig
 * @constructor
 * @param {Object} config - config object
 */
function LanguageSwitcherConfig(config) {
    AbstractConfig.call(this, config);
}

/* Inherits AbstractConfig */
LanguageSwitcherConfig.prototype = Object.create(AbstractConfig.prototype);

/**
 * Get config for a specific site
 * @param {string} siteId - site ID
 * @returns {Object|null} - object with configs for site
 */
LanguageSwitcherConfig.prototype.getSiteConfig = memoizationUtils.memoize(
    function (siteId) {
        if (!this.config) {
            return null;
        }
        var siteConfig = objectUtils.merge(this.config.defaultSiteConfig || {}, this.config[siteId] || {});
        return (Object.keys(siteConfig).length > 0 ? siteConfig : null);
    },
    memoizationUtils.getResolverSimpleKey
);

/**
 * Is language switcher enabled for a specific site
 * @param {string} siteId - site ID
 * @returns {boolean} - result of checking
 */
LanguageSwitcherConfig.prototype.isEnabled = function (siteId) {
    var siteConfig = this.getSiteConfig(siteId);
    return !!(siteConfig && siteConfig.enabled);
};

/**
 * Get countries config for a specific site
 * @param {string} siteId - site ID
 * @returns {Object|null} - countries config object
 */
LanguageSwitcherConfig.prototype.getCountriesConfig = function (siteId) {
    var siteConfig = this.getSiteConfig(siteId);
    return (siteConfig && siteConfig.countriesConfig) || null;
};

/**
 * Get languages config for a specific site
 * @param {string} siteId - site ID
 * @returns {Object|null} - languages config object
 */
LanguageSwitcherConfig.prototype.getLanguagesConfig = function (siteId) {
    var siteConfig = this.getSiteConfig(siteId);
    return (siteConfig && siteConfig.languagesConfig) || null;
};

/**
 * Get language config output data for a specific site
 * @param {string} siteId - site ID
 * @returns {Object} - language switcher config
 */
LanguageSwitcherConfig.prototype.getConfigOutputData = memoizationUtils.memoize(
    function (siteId) {
        return {
            siteConfig: this.getSiteConfig(siteId),
            enabled: this.isEnabled(siteId),
            countriesConfig: this.getCountriesConfig(siteId),
            languagesConfig: this.getLanguagesConfig(siteId)
        };
    },
    memoizationUtils.getResolverSimpleKey
);

module.exports = LanguageSwitcherConfig;
