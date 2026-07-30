'use strict';

/**
 * Initializes Global-e
 * @param {string} countryCodeISO - ISO2 Country Code
 * @param {string} currencyCodeISO - ISO2 Currency Code
 */
function globaleInit(countryCodeISO, currencyCodeISO) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var priceBookHelpers = require('*/cartridge/scripts/helpers/priceBookHelpers');
    var globaleCountryHelpers = require('*/cartridge/scripts/helpers/globaleCountryHelpers');
    var globaleSession = require('*/cartridge/models/globale/session');
    var globaleRequest = require('*/cartridge/models/globale/request');
    var globaleCookie = require('*/cartridge/models/globale/cookie');
    var globaleCulture = require('*/cartridge/models/globale/culture');
    var globaleCountryCoefficient = require('*/cartridge/models/globale/countryCoefficient');
    var geCountryMgr = require('*/cartridge/scripts/factories/globale/geCountryMgr');
    var geAppSettingsMgr = require('*/cartridge/scripts/factories/globale/geAppSettingsMgr');

    var logger = globaleHelpers.getLogger();

    try {
        // store previous session values;
        var prevCountryCode = globaleSession.get('geCountry');

        // reset session attributes if Global-e disabled or the request belongs to Global-e
        if (!globaleHelpers.isGlobaleEnabled() || globaleHelpers.isGlobaleRequest()) {
            globaleSession.setDefaults();
            return;
        }

        // get Global-e AppSettings
        var geAppSettings = globaleHelpers.getGlobaleAppSettings();

        // load Global-e cookie
        var geCookie = globaleCookie.load(countryCodeISO, currencyCodeISO);

        // get Global-e country and currency codes
        var countryCode = globaleCountryHelpers.getRequestCountryCode(geCookie);
        var currencyCode = globaleCountryHelpers.getRequestCurrencyCode(geCookie);

        // get Global-e country
        var geCountry = geCountryMgr.getGECountry(countryCode).getCustom();

        // update currency code if required
        currencyCode = globaleCountryHelpers.getCurrencyCode(geCountry, currencyCode, prevCountryCode !== countryCode);

        // get Global-e culture code
        var cultureCode = globaleCulture.getGlobaleCultureCode(countryCode, globaleRequest.get('locale'));

        // update Global-e cookie
        geCookie = globaleCookie.save(countryCode, cultureCode, currencyCode, geAppSettings.webClientVersion);

        // init Global-e session attributes
        globaleSession.setDefaults();
        globaleSession.set('geEnabled', true);
        globaleSession.set('geLocale', globaleRequest.get('locale'));
        globaleSession.set('geCountry', countryCode);
        globaleSession.set('geCountryName', geCountry.name);
        globaleSession.set('geCurrency', currencyCode);
        globaleSession.set('geCulture', cultureCode);
        globaleSession.set('geApiVersion', geAppSettings.webClientVersion);
        globaleSession.set('geOperatedCountry', geCountry.isOperatedByGlobalE);
        globaleSession.set('gePriceStrategy', globaleCountryHelpers.isFixedPriceStrategySupported(geAppSettings, geCountry) ? globaleHelpers.consts.priceStrategy.FIXED : globaleHelpers.consts.priceStrategy.DYNAMIC);
        globaleSession.set('geUseFixedPricesOnly', !!geAppSettingsMgr.getPlatformSetting(globaleHelpers.platformSettings.sfccUseFixedPricesOnly, false, 'boolean'));
        globaleSession.set('geUseCountryVAT', geCountry.useCountryVAT);
        globaleSession.set('geDefaultCountryVATRate', globaleCountryHelpers.getDefaultVATRateType(geCountry));
        globaleSession.set('geCountryCoefficientIncludeVAT', globaleCountryCoefficient.getIncludeVAT(countryCode));

        // update session pricebooks
        priceBookHelpers.updateApplicablePriceBooks(geCountry.isOperatedByGlobalE);

        // call Global-e init hook
        globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.init);
    } catch (e) {
        globaleSession.setDefaults();
        logger.error('GLOBALE_INIT: {0}', logger.message(e));
    }
}

module.exports = globaleInit;
