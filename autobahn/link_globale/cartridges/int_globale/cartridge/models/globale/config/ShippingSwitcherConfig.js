'use strict';

var AbstractConfig = require('*/cartridge/models/globale/config/AbstractConfig');
var objectUtils = require('*/cartridge/scripts/util/globale/object');
var memoizationUtils = require('*/cartridge/scripts/util/globale/memoization');

/**
 * Represents ShippingSwitcherConfig
 * @constructor
 * @param {Object} config - config object
 */
function ShippingSwitcherConfig(config) {
    AbstractConfig.call(this, config);
}

/* Inherits AbstractConfig */
ShippingSwitcherConfig.prototype = Object.create(AbstractConfig.prototype);

/**
 * Get Site Config for a specific site.
 * @param {string} siteId - site ID
 * @returns {Object|null} - object with configs for site
 */
ShippingSwitcherConfig.prototype.getSiteConfig = memoizationUtils.memoize(
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
 * Checks if redirect should be proceed to the same page as is current in context of one site
 * By default is returned 'true'
 * Only if 'redirectToSamePage' have false value - it will return 'false'
 * @param {string} siteId - site ID
 * @returns {boolean} - result of checking
 */
ShippingSwitcherConfig.prototype.isRedirectToSamePage = function (siteId) {
    var siteConfig = this.getSiteConfig(siteId);
    return !!(!siteConfig || siteConfig.redirectToSamePage !== false);
};

/**
 * Checks if redirect should be proceed to the same page as is current accross different sites
 * By default is returned 'true'
 * Only if 'redirectToSamePageAcrossSites' have false value - it will return 'false'
 * @param {string} siteId - site ID
 * @returns {boolean} - result of checking
 */
ShippingSwitcherConfig.prototype.isRedirectToSamePageAcrossSites = function (siteId) {
    var siteConfig = this.getSiteConfig(siteId);
    return !!(!siteConfig || siteConfig.redirectToSamePageAcrossSites !== false);
};

/**
 * Checks if GE parameters 'glCountry' and 'glCurrency' should be added to the URL for the specified site.
 * @param {string} siteId - site ID
 * @returns {boolean} - result of checking
 */
ShippingSwitcherConfig.prototype.isAddGeParametersToUrl = function (siteId) {
    var siteConfig = this.getSiteConfig(siteId);
    return !!(!siteConfig || siteConfig.addGeParametersToUrl !== false);
};

/**
 * Check if the geo country popup should be shown for a specific site.
 * @param {string} siteId - site ID
 * @returns {boolean} - result of checking
 */
ShippingSwitcherConfig.prototype.isShowGeoCountryPopup = function (siteId) {
    var siteConfig = this.getSiteConfig(siteId);
    return !!(siteConfig && siteConfig.showGeoCountryPopup !== false);
};

/**
 * Get the allowed countries list for a specific site.
 * @param {string} siteId - site ID
 * @return {Array|null} The list of allowed countries, or null if the config is not found
 */
ShippingSwitcherConfig.prototype.getSiteAllowedCountries = function (siteId) {
    var siteConfig = this.getSiteConfig(siteId);
    return (siteConfig && siteConfig.allow) || null;
};

/**
 * Get the disallowed countries list for a specific site.
 * @param {string} siteId - site ID
 * @return {Array|null} The list of disallowed countries, or null if the config is not found
 */
ShippingSwitcherConfig.prototype.getSiteDisallowedCountries = function (siteId) {
    var siteConfig = this.getSiteConfig(siteId);
    return (siteConfig && siteConfig.disallow) || null;
};

/**
 * Get the list of rules for a specific site and locale.
 * @param {string} siteId - site ID
 * @param {string} localeId - locale ID
 * @return {Object|null} The list of rules, or null if the config is not found
 */
ShippingSwitcherConfig.prototype.getLocaleConfig = memoizationUtils.memoize(
    function (siteId, localeId) {
        var siteConfig = this.getSiteConfig(siteId);
        return (siteConfig && siteConfig.localeRules && siteConfig.localeRules[localeId]) || null;
    },
    memoizationUtils.getResolverSimpleKey
);

/**
 * Get the allowed countries list for a specific site and locale.
 * @param {string} siteId - site ID
 * @param {string} localeId - locale ID
 * @return {Array|null} The list of allowed countries, or null if the config is not found
 */
ShippingSwitcherConfig.prototype.getLocaleAllowedCountries = function (siteId, localeId) {
    var localeConfig = this.getLocaleConfig(siteId, localeId);
    return (localeConfig && localeConfig.allow) || null;
};

/**
 * Get the disallowed countries list for a specific site and locale.
 * @param {string} siteId - site ID
 * @param {string} localeId - locale ID
 * @return {Array|null} The list of disallowed countries, or null if the config is not found
 */
ShippingSwitcherConfig.prototype.getLocaleDisallowedCountries = function (siteId, localeId) {
    var localeConfig = this.getLocaleConfig(siteId, localeId);
    return (localeConfig && localeConfig.disallow) || null;
};

/**
 * Is stick to locale for a specific site and locale.
 * @param {string} siteId - site ID
 * @returns {boolean} - result of checking
 */
ShippingSwitcherConfig.prototype.isStickToLocale = function (siteId) {
    var siteConfig = this.getSiteConfig(siteId);
    return !!(siteConfig && siteConfig.localeRules && siteConfig.localeRules.stickToLocale);
};

/**
 * Get shipping switcher config output data for a specific site
 * @param {string} siteId - site ID
 * @param {string} localeId - locale ID
 * @returns {Object} - shipping switcher config
 */
ShippingSwitcherConfig.prototype.getConfigOutputData = memoizationUtils.memoize(
    function (siteId, localeId) {
        return {
            siteConfig: this.getSiteConfig(siteId),
            redirectToSamePage: this.isRedirectToSamePage(siteId),
            redirectToSamePageAcrossSites: this.isRedirectToSamePageAcrossSites(siteId),
            addGeParametersToUrl: this.isAddGeParametersToUrl(siteId),
            showGeoCountryPopup: this.isShowGeoCountryPopup(siteId),
            siteAllowedCountries: this.getSiteAllowedCountries(siteId),
            siteDisallowedCountries: this.getSiteDisallowedCountries(siteId),
            localeConfig: this.getLocaleConfig(siteId, localeId),
            localeAllowedCountries: this.getLocaleAllowedCountries(siteId, localeId),
            localeDisallowedCountries: this.getLocaleDisallowedCountries(siteId, localeId),
            stickToLocale: this.isStickToLocale(siteId)
        };
    },
    memoizationUtils.getResolverSimpleKey
);

module.exports = ShippingSwitcherConfig;
