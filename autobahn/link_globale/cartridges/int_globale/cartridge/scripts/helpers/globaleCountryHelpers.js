/* global session */

'use strict';

/**
 * Checks if customer's country allowed for the current site
 * @param {string} countryCode - Country code
 * @returns {boolean} - If it is true - then customer's country allowed for the current site
 */
function isSiteAllowedForCountry(countryCode) {
    var Site = require('dw/system/Site');
    var Locale = require('dw/util/Locale');
    var globaleRequest = require('*/cartridge/models/globale/request');
    var geConfigurationMgr = require('*/cartridge/scripts/factories/globale/geConfigurationMgr');
    var shippingSwitcherConfig = geConfigurationMgr.getShippingSwitcherConfig();
    var shippingSwitcherConfigOutputData = shippingSwitcherConfig.getConfigOutputData(Site.getCurrent().getID(), globaleRequest.get('locale'));

    // general validation
    if (!shippingSwitcherConfigOutputData.siteConfig) {
        return true;
    }

    // check site rules
    // allowed countries
    var siteAllowedCountries = shippingSwitcherConfigOutputData.siteAllowedCountries;
    if (siteAllowedCountries && Array.isArray(siteAllowedCountries) && siteAllowedCountries.indexOf(countryCode) === -1) {
        return false;
    }

    // disallowed countries
    var siteDisallowedCountries = shippingSwitcherConfigOutputData.siteDisallowedCountries;
    if (siteDisallowedCountries && Array.isArray(siteDisallowedCountries) && siteDisallowedCountries.indexOf(countryCode) !== -1) {
        return false;
    }

    // check locale rules
    var requestLocale = Locale.getLocale(globaleRequest.get('locale'));
    var localeCountry = requestLocale && requestLocale.country;
    if (shippingSwitcherConfigOutputData.localeConfig) {
        // allowed countries
        var localeAllowedCountries = shippingSwitcherConfigOutputData.localeAllowedCountries;
        if (localeAllowedCountries && Array.isArray(localeAllowedCountries) && localeAllowedCountries.indexOf(countryCode) === -1) {
            return false;
        }

        // disallowed countries
        var localeDisallowedCountries = shippingSwitcherConfigOutputData.localeDisallowedCountries;
        if (localeDisallowedCountries && Array.isArray(localeDisallowedCountries) && localeDisallowedCountries.indexOf(countryCode) !== -1) {
            return false;
        }
    } else if (shippingSwitcherConfigOutputData.stickToLocale && countryCode !== localeCountry) {
        return false;
    }

    return true;
}

/**
 * Checks if fixed price strategy supported
 * @param {Object} geAppSettings - Gloabl-e AppSettings
 * @param {Object} geCountry - Gloabl-e country
 * @return {boolean} - fixed price strategy supported
 */
function isFixedPriceStrategySupported(geAppSettings, geCountry) {
    return (
        ('SupportFixedPrices' in geAppSettings.serverSettings)
        && ('Value' in geAppSettings.serverSettings.SupportFixedPrices)
        && (geAppSettings.serverSettings.SupportFixedPrices.Value === 'true')
        && geCountry.supportsFixedPrices
    );
}

/**
 * Retrieves Country Code from Current Request geolocation
 * @returns {string} - CountryCode
 */
function getCountryCodeFromLocation() {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleRequest = require('*/cartridge/models/globale/request');
    var countryCode = null;
    var geolocation = globaleRequest.get('geolocation');

    if (geolocation && ('countryCode' in geolocation) && geolocation.countryCode) {
        countryCode = geolocation.countryCode;
    }
    if (!countryCode) {
        globaleHelpers.getLogger().warn('Can\'t find countryCode in request.geolocation!');
    }
    return countryCode;
}

/**
 * Retrieves Country Code from Current Request locale
 * @returns {string} - CountryCode
 */
function getCountryCodeFromLocale() {
    var Locale = require('dw/util/Locale');
    var globaleRequest = require('*/cartridge/models/globale/request');
    var countryCode = null;

    var locale = Locale.getLocale(globaleRequest.get('locale'));
    if (locale && locale.getCountry()) {
        countryCode = locale.getCountry();
    }
    return countryCode;
}

/**
 * Retrieves Global-e Country Code from request or geo-location
 * @throws {Error}
 * @param {Object|null} geCookie - Existing Global-e Cookie object or null if it's initial request
 * @returns {string} - Global-e Country Code
 */
function getRequestCountryCode(geCookie) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleRequest = require('*/cartridge/models/globale/request');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');
    var geCountryMgr = require('*/cartridge/scripts/factories/globale/geCountryMgr');
    var httpParameterMap = globaleRequest.get('httpParameterMap');
    var logger = globaleHelpers.getLogger();
    var countryCode = null;

    // get country from request locale (if enabled)
    if (geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccParseCountryCodeFromRequestLocale, false, 'boolean')) {
        var requestCountryCode = getCountryCodeFromLocale();
        if (requestCountryCode && geCountryMgr.isCountryExists(requestCountryCode)) {
            countryCode = requestCountryCode;
        }
    }

    // get country from the parameter in the request URL
    if (
        !countryCode && httpParameterMap && httpParameterMap.isParameterSubmitted('glCountry') && httpParameterMap.glCountry.value &&
        geCountryMgr.isCountryExists(httpParameterMap.glCountry.value) && isSiteAllowedForCountry(httpParameterMap.glCountry.value)
    ) {
        countryCode = httpParameterMap.glCountry.value;
    }

    // get country from previous request, existing cookies
    if (
        !countryCode && geCookie && ('countryISO' in geCookie) && geCookie.countryISO &&
        geCountryMgr.isCountryExists(geCookie.countryISO) && isSiteAllowedForCountry(geCookie.countryISO)
    ) {
        countryCode = geCookie.countryISO;
    }

    // get country from geo location
    if (!countryCode) {
        var geoLocaltionCountryCode = getCountryCodeFromLocation();
        if (geCountryMgr.isCountryExists(geoLocaltionCountryCode) && isSiteAllowedForCountry(geoLocaltionCountryCode)) {
            countryCode = geoLocaltionCountryCode;
        }
    }

    // get country from merchant app setting 'sfccSiteDefaultCountryCode'
    if (!countryCode) {
        var defaultCountryCode = globaleHelpers.getDefaultCountryCode();
        if (geCountryMgr.isCountryExists(defaultCountryCode)) {
            countryCode = defaultCountryCode;
            logger.warn('Failed to get CountryCode neither from glCountry parameter nor from request.geolocation.countryCode.\n' +
            'Will try to take default CountryCode = {0}', countryCode);
        }
    }

    if (!countryCode) {
        throw new Error('Failed to get CountryCode!');
    }

    return countryCode;
}

/**
 * Retrieves Global-e Currency Code from request
 * @param {Object|null} geCookie - Existing Global-e Cookie object or null if it's initial request
 * @returns {string} - Global-e Currency Code
 */
function getRequestCurrencyCode(geCookie) {
    var globaleRequest = require('*/cartridge/models/globale/request');
    var httpHeaders = globaleRequest.get('httpHeaders');
    var httpParameters = globaleRequest.get('httpParameters');
    var httpParameterMap = globaleRequest.get('httpParameterMap');
    var geCurrencyMgr = require('*/cartridge/scripts/factories/globale/geCurrencyMgr');

    // get currency from special Global-e headers
    var currencyCode = httpHeaders.get('x-globale-currency');

    // get currency from HTTP parameter submitted in OCAPI/SCAPI context
    if (!currencyCode && httpParameters) {
        var currencyCodeHttpParam = httpParameters.get('glCurrency');
        if (currencyCodeHttpParam && currencyCodeHttpParam.length > 0 && geCurrencyMgr.isCurrencyExists(currencyCodeHttpParam[0])) {
            currencyCode = currencyCodeHttpParam[0];
        }
    }

    // get currency from the parameter in the request URL - highest priority
    if (
        !currencyCode && httpParameterMap && httpParameterMap.isParameterSubmitted('glCurrency') &&
        httpParameterMap.glCurrency.value && geCurrencyMgr.isCurrencyExists(httpParameterMap.glCurrency.value)
    ) {
        currencyCode = httpParameterMap.glCurrency.value;
    }

    // get currency from previous request, existing cookies - lowest priority
    if (
        !currencyCode && geCookie && ('currencyCode' in geCookie) &&
        geCookie.currencyCode && geCurrencyMgr.isCurrencyExists(geCookie.currencyCode)
    ) {
        currencyCode = geCookie.currencyCode;
    }

    return currencyCode;
}

/**
 * Returns Global-e Currency Code which should be applied
 * @param {Object} geCountry - Global-e Country
 * @param {string} requestCurrencyCode - Global-e Request Currency Code
 * @param {boolean|undefined} isCountryChanged - Flag to indicate if country is changed
 * @returns {string} - Global-e Currency Code
 */
function getCurrencyCode(geCountry, requestCurrencyCode, isCountryChanged) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geCountryMgr = require('*/cartridge/scripts/factories/globale/geCountryMgr');
    var geCurrencyMgr = require('*/cartridge/scripts/factories/globale/geCurrencyMgr');
    var allowedCurrencies = geCountryMgr.getAllowedCountryCurrencies(geCountry.code);

    // non-operated countries: use SFCC session currency code
    if (!geCountry.isOperatedByGlobalE) {
        return session.currency.currencyCode;
    }

    // fixed price countries: always use default currency code
    if (geCountry.supportsFixedPrices) {
        return geCountryMgr.getDefaultCurrencyCode(geCountry.code);
    }

    // dynamic price countries
    // use default currency code if "geResetCurrencyCodeOnCountryChange" set to true
    if (globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geResetCurrencyCodeOnCountryChange) && isCountryChanged) {
        return geCountryMgr.getDefaultCurrencyCode(geCountry.code);
    }

    // use request currency code if exists
    if (requestCurrencyCode && (allowedCurrencies.indexOf(requestCurrencyCode) !== -1) && geCurrencyMgr.isCurrencyExists(requestCurrencyCode)) {
        return requestCurrencyCode;
    }

    // use default currency code by default or session currency code as a fallback
    return geCountryMgr.getDefaultCurrencyCode(geCountry.code) || session.currency.currencyCode;
}

/**
 * Returns Global-e Country default VAT Rate Type
 * @param {Object} geCountry -  Global-e Country
 * @returns {string} - Global-e Country default VAT Rate Type
 */
function getDefaultVATRateType(geCountry) {
    var logger = require('*/cartridge/scripts/helpers/globaleHelpers').getLogger();
    var result = null;
    try {
        var defaultVATRateType = geCountry.defaultVATRateType && JSON.parse(geCountry.defaultVATRateType);
        if (defaultVATRateType && ('Rate' in defaultVATRateType) && defaultVATRateType.Rate) {
            result = defaultVATRateType.Rate;
        }
    } catch (e) {
        logger.error('getDefaultVATRateType: {0}', logger.message(e));
    }
    return result;
}

/**
 * Retrieves the data of Site URL configured for Global-e country, parses and generates the real redirect URL.
 * @example siteUrl
 *   The format should be as following:
 *   action|SiteID|locale[|hostName|parameter1=value1|...]
 *   Parameters should be in the following format:
 *   parameter1=value1|parameter2=value2|...|parameterN=valueN
 *   Home-Show|RefArchGlobal|default
 *   Home-Show|RefArchGlobal|default|dev02.sfcc.bglobale.de
 *   Home-Show|RefArchGlobal|default|null|redirect=false
 * @returns {null|string} - Returns redirect URL,
 */
function getRedirectUrl() {
    var Site = require('dw/system/Site');
    var Locale = require('dw/util/Locale');
    var URLAction = require('dw/web/URLAction');
    var URLUtils = require('dw/web/URLUtils');
    var globaleRequest = require('*/cartridge/models/globale/request');
    var geCountryMgr = require('*/cartridge/scripts/factories/globale/geCountryMgr');
    var geConfigurationMgr = require('*/cartridge/scripts/factories/globale/geConfigurationMgr');
    var httpParameterMap = globaleRequest.get('httpParameterMap');
    var shippingSwitcherConfig = geConfigurationMgr.getShippingSwitcherConfig();
    var shippingSwitcherConfigOutputData = shippingSwitcherConfig.getConfigOutputData(Site.current.ID, globaleRequest.get('locale'));
    var siteUrl = (httpParameterMap.isParameterSubmitted('countryCode') && httpParameterMap.countryCode.rawValue)
        ? geCountryMgr.getCountrySiteURL(httpParameterMap.countryCode.rawValue)
        : null;

    // return direct country redirect URL if it exists
    if (/^(http[s]?:\/\/|www\.).*$/.test(siteUrl)) {
        return siteUrl;
    }

    // define default redirect parameters
    var action = 'Home-Show';
    var siteId = Site.current.ID;
    var locale = globaleRequest.get('locale');

    // override redirect parameters by country's configuration
    if (siteUrl) {
        siteUrl = siteUrl.split('|'); // eslint-disable-line no-param-reassign
        if (siteUrl.length >= 3) {
            action = siteUrl[0];
            siteId = siteUrl[1];
            locale = siteUrl[2];
        }
    }

    // define the behavior based on shipping switcher configuration
    var redirectToSamePage = (Site.current.ID === siteId) ? shippingSwitcherConfigOutputData.redirectToSamePage : shippingSwitcherConfigOutputData.redirectToSamePageAcrossSites;
    var addGeParametersToUrl = shippingSwitcherConfigOutputData.addGeParametersToUrl;

    // override parameters by request's data
    if (
        redirectToSamePage &&
        httpParameterMap.isParameterSubmitted('action') && httpParameterMap.action.rawValue &&
        !(
            httpParameterMap.action.rawValue.substring(0, 6) === 'Sites-' &&
            httpParameterMap.action.rawValue.substring(httpParameterMap.action.rawValue.length - 5) === '-Site'
        )
    ) {
        action = httpParameterMap.action.rawValue;
    }
    if (httpParameterMap.isParameterSubmitted('localeCode') && httpParameterMap.localeCode.rawValue) {
        locale = httpParameterMap.localeCode.rawValue;
    }

    // define URL action arguments
    var urlActionArguments = [null, action, siteId];

    // add locale and host if they exist
    urlActionArguments.push(Locale.getLocale(locale) ? locale : '');

    // + add host from country URL configuration if it exists
    if (siteUrl && siteUrl.length >= 4 && siteUrl[3] !== 'null') {
        urlActionArguments.push(siteUrl[3]);
    }

    // generate redirect URL
    var siteRedirectUrl = URLUtils.https(new (Function.prototype.bind.apply(URLAction, urlActionArguments))());

    // decorate redirect URL
    // + URL Parameters: parameter1=value1|parameter2=value2|...|parameterN=valueN
    if (siteUrl && siteUrl.length > 4) {
        siteUrl.slice(4).forEach(function (parameter) {
            var urlParam = parameter.split('=');
            if (urlParam.length === 2) {
                siteRedirectUrl = siteRedirectUrl.append(urlParam[0], urlParam[1]);
            }
        });
    }

    // add Globale GET parameters to URL
    if (addGeParametersToUrl) {
        if (httpParameterMap.isParameterSubmitted('countryCode') && httpParameterMap.countryCode.rawValue) {
            siteRedirectUrl = siteRedirectUrl.append('glCountry', httpParameterMap.countryCode.rawValue);
        }
        if (httpParameterMap.isParameterSubmitted('currencyCode') && httpParameterMap.currencyCode.rawValue) {
            siteRedirectUrl = siteRedirectUrl.append('glCurrency', httpParameterMap.currencyCode.rawValue);
        }
    }

    // copy querystring params in case of redirect to the same page
    if (redirectToSamePage && httpParameterMap.isParameterSubmitted('querystring') && httpParameterMap.querystring.rawValue) {
        var queryParams = httpParameterMap.querystring.rawValue.split('&');
        queryParams.forEach(function (param) {
            var queryParam = param.split('=');
            if (queryParam.length === 2) {
                if (['glCountry', 'glCurrency'].indexOf(queryParam[0]) !== -1) {
                    return;
                }
                siteRedirectUrl = siteRedirectUrl.append(queryParam[0], queryParam[1]);
            }
        });
    }
    siteRedirectUrl = siteRedirectUrl.toString();

    return siteRedirectUrl;
}

module.exports = {
    isFixedPriceStrategySupported: isFixedPriceStrategySupported,
    getCountryCodeFromLocation: getCountryCodeFromLocation,
    getCountryCodeFromLocale: getCountryCodeFromLocale,
    getRequestCountryCode: getRequestCountryCode,
    getRequestCurrencyCode: getRequestCurrencyCode,
    getCurrencyCode: getCurrencyCode,
    getDefaultVATRateType: getDefaultVATRateType,
    getRedirectUrl: getRedirectUrl
};
