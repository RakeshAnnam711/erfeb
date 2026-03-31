'use strict';

var countries = require('*/cartridge/config/countries');
var countriesLocaleExtender = {};

var Locale = require('dw/util/Locale');
var Site = require('dw/system/Site');

var currentSite = Site.getCurrent();
var defaultLocale = currentSite.defaultLocale;
var countrySelectorLocale = currentSite.getCustomPreferenceValue('headerCountrySelectorSource') || {};

/**
 * Map Locale to Countries
 * Code/SitePref can extend the countries object with additional attributes
 * for use in the rendering template or extended Locale Model
 */
(countries || []).forEach(function (country) {
    var id = country.id;
    var keys = (Object.keys(country) || []).filter(function (key) { return key !== 'id'});

    // Disallow duplicate id override
    if (id in countriesLocaleExtender) return;

    countriesLocaleExtender[id] = {};

    keys.forEach(function (key) {
        countriesLocaleExtender[id][key] = country[key];
    });
});

/**
 * returns object needed to render links to change the locale of the site
 * @param {string} allowedLocales - list of allowed locales for the site
 * @returns {Array} - array of Objects representing available locales
 */
 function getLocaleLinks(allowedLocales) {
    var scope = this;
    var localeOptions = [];

    allowedLocales = allowedLocales.toArray() || [];

    allowedLocales.forEach(function (localeid) {
        var apiLocale = Locale.getLocale(localeid);
        var localeExt = countriesLocaleExtender[localeid] || {};

        if (!(scope.isLocaleValid(apiLocale))) return;

        var localeOption = {
            localID: localeid,
            localeID: localeid, //backwards compatibility
            currencyCode: null,
            displayName: apiLocale.displayName,
            country: apiLocale.country, //backwards compatibility
            countryCode: apiLocale.country,
            displayCountry: apiLocale.displayCountry,
            language: apiLocale.language,
            displayLanguage: apiLocale.displayLanguage
        };

        // Add additional configs from countries object
        Object.keys(localeExt).forEach(function (extProp) {
            if (!(extProp in localeOption) || empty(localeOption[extProp])) {
                localeOption[extProp] = localeExt[extProp];
            }
        });

        localeOptions.push(localeOption);
    });

    // Append NonSFCC Locale Country Configs
    Object.keys(countriesLocaleExtender || {})
    .filter(function (countryLocaleID) {
        return allowedLocales.indexOf(countryLocaleID) === -1;
    })
    .forEach(function (countryLocaleID) {
        var nonSFCCLocaleID = countriesLocaleExtender[countryLocaleID];

        // Skip external locales if custom boolean missing
        if (!nonSFCCLocaleID.custom) return;

        localeOptions.push(nonSFCCLocaleID);
    });

    if (countrySelectorLocale.value === 'code') {
        //filter by country
        localeOptions = localeOptions.filter(function (localeOpt) {
            return !!(localeOpt.localeID in countriesLocaleExtender);
        });
    }

    return localeOptions;
}

/**
 * Performs a deeper check on a plain locale object
 * @param {dw.util.Locale} currentLocale - current locale of the request
 * @return {boolean} - returns true
 */
function isLocaleValid(currentLocale) {
    return currentLocale && currentLocale.ID;
}

/**
 * Represents current locale information in plain object
 * @param {dw.util.Locale} currentLocale - current locale of the request
 * @param {string} allowedLocales - list of allowed locales for the site
 * @param {string} siteId - id of the current site
 * @constructor
 */
function LocaleModel(currentLocale, allowedLocales, siteId) {
    var allLocaleLinks = this.getLocaleLinks(allowedLocales);

    if (false && (allLocaleLinks ||[]).length === 1) {
        this.locale = allLocaleLinks[0];
    } else {
        // Set current locale match obj
        this.locale = (allLocaleLinks || []).find(function (localeObj) {
            return localeObj.localeID === currentLocale.ID;
        });

        if (empty(this.locale)) {
            // Set current locale default obj
            this.locale = (allLocaleLinks || []).find(function (localeObj) {
                return localeObj.localeID === defaultLocale;
            });
        }
    }

    // prevent failure on no match check
    this.locale = this.locale || {};
    // optional all values for additional sorting/manipulation
    this.locale.allLocaleLinks = allLocaleLinks;
    // backwards compatibility for SFRA
    this.locale.localeLinks = allLocaleLinks.filter(function (localeObj) {
        return localeObj.localeID !== currentLocale.ID;
    });

}

LocaleModel.prototype.getLocaleLinks = getLocaleLinks;
LocaleModel.prototype.isLocaleValid = isLocaleValid;

module.exports = LocaleModel;
