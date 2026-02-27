'use strict';

var AbstractConfig = require('*/cartridge/models/globale/config/AbstractConfig');
var arrayUtils = require('*/cartridge/scripts/util/globale/array');

/**
 * Represents KlarnaConfigurations
 * @constructor
 * @param {Object} config - config object
 * @param {string} locale - request locale
 * @param {string} country - current country
 */
function KlarnaConfigurations(config, locale, country) {
    AbstractConfig.call(this, config);

    this.locale = locale;
    this.country = country;
    this.klarnaOSMConfig = this.getByAllowedLocales(locale) || this.getByAllowedCountries(country) || null;
}

/* Inherits AbstractConfig */
KlarnaConfigurations.prototype = Object.create(KlarnaConfigurations.prototype);

/**
 * Returns Klarna JavaScript library
 * @returns {string} - Lib Url
 */
KlarnaConfigurations.prototype.getLibUrl = function () {
    return (this.klarnaOSMConfig && this.klarnaOSMConfig.libUrl) || null;
};

/**
 * Returns Klarna OSM identifier
 * @returns {string} - identifier
 */
KlarnaConfigurations.prototype.getDataClientId = function () {
    return (this.klarnaOSMConfig && this.klarnaOSMConfig.dataclientid) || null;
};

/**
 * Returns configurations for request locale
 * @param {string} locale - request locale
 * @returns {Object} - object with configs for request locale
 */
KlarnaConfigurations.prototype.getByAllowedLocales = function (locale) {
    if (!this.config) {
        return null;
    }

    return arrayUtils.find(this.config, function (geKlarnaRegion) {
        return geKlarnaRegion.allowedLocales && geKlarnaRegion.allowedLocales.indexOf(locale) !== -1;
    });
};

/**
 * Returns configurations for current country
 * @param {string} country - current country
 * @returns {Object} - object with configs for current country
 */
KlarnaConfigurations.prototype.getByAllowedCountries = function (country) {
    if (!this.config) {
        return null;
    }

    return arrayUtils.find(this.config, function (geKlarnaRegion) {
        return geKlarnaRegion.allowedCountries && geKlarnaRegion.allowedCountries.indexOf(country) !== -1;
    });
};

/**
 * Returns identifier for the OSM placement
 * @returns {string} - placement's identifier
 */
KlarnaConfigurations.prototype.getPdpKey = function () {
    return (this.klarnaOSMConfig && this.klarnaOSMConfig.pdpKey) || null;
};

/**
 * Returns current locale in the correct format for the OSM
 * @returns {string} - current locale
 */
KlarnaConfigurations.prototype.getLocale = function () {
    var Locale = require('dw/util/Locale');
    var currentLocale = Locale.getLocale(this.locale);

    return (currentLocale && currentLocale.language) ? (currentLocale.language + '-' + this.country) : null;
};

module.exports = KlarnaConfigurations;
