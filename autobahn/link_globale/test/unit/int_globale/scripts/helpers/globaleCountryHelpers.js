'use strict';

var mockFactories = require('../../../../mock/factories/index');
var assert = require('chai').assert;

var globaleCountryHelpers = mockFactories.scripts.helpers.globaleCountryHelpers;
var globaleHelpers = mockFactories.scripts.helpers.globaleHelpers;
var request = require('../../../../mock/request');
var session = require('../../../../mock/session');
var logger = require('../../../../mock/dw/system/Logger');

describe('scripts/helpers/globaleCountryHelpers.js', function () {
    describe('isFixedPriceStrategySupported', function () {
        it('isFunction', function () {
            assert.isFunction(globaleCountryHelpers.isFixedPriceStrategySupported);
        });

        it('should be supported if enabled in both app settings and on country level', function () {
            var geAppSettings = { serverSettings: { SupportFixedPrices: { Value: 'true' } } };
            var geCountry = { supportsFixedPrices: true };
            assert.equal(globaleCountryHelpers.isFixedPriceStrategySupported(geAppSettings, geCountry), true);
        });

        it('should not be supported if disabled in app settings', function () {
            var geAppSettings = { serverSettings: {} };
            var geCountry = { supportsFixedPrices: true };
            assert.equal(globaleCountryHelpers.isFixedPriceStrategySupported(geAppSettings, geCountry), false);
        });

        it('should not be supported if disabled on country level', function () {
            var geAppSettings = { serverSettings: { SupportFixedPrices: { Value: 'true' } } };
            var geCountry = { supportsFixedPrices: false };
            assert.equal(globaleCountryHelpers.isFixedPriceStrategySupported(geAppSettings, geCountry), false);
        });
    });

    describe('getCountryCodeFromLocation', function () {
        it('isFunction', function () {
            assert.isFunction(globaleCountryHelpers.getCountryCodeFromLocation);
        });

        it('should be GB according to request geolocation', function () {
            request.geolocation.countryCode = 'GB';
            assert.equal(globaleCountryHelpers.getCountryCodeFromLocation(), 'GB');
        });

        it('should be null according to request geolocation', function () {
            request.geolocation.countryCode = null;
            assert.equal(globaleCountryHelpers.getCountryCodeFromLocation(), null);
            assert.isOk(logger.getMessages().warn.indexOf('Can\'t find countryCode in request.geolocation!') !== -1, 'no warn message');
        });
    });

    describe('getRequestCountryCode', function () {
        it('isFunction', function () {
            assert.isFunction(globaleCountryHelpers.getRequestCountryCode);
        });

        it('get country from request locale', function () {
            assert.equal(globaleCountryHelpers.getRequestCountryCode(), 'GB');
        });

        it('get country from the parameter in the request URL', function () {
            request.httpParameterMap.set('glCountry', { value: 'CA' });
            assert.equal(globaleCountryHelpers.getRequestCountryCode(), 'CA');
            request.httpParameterMap.remove('glCountry');
        });

        it('get country from previous request, existing cookies', function () {
            var geCookie = { countryISO: 'CA' };
            assert.equal(globaleCountryHelpers.getRequestCountryCode(geCookie), 'CA');
        });

        it('get country from geo location', function () {
            request.geolocation.countryCode = 'CA';
            assert.equal(globaleCountryHelpers.getRequestCountryCode(), 'CA');
            request.geolocation.countryCode = null;
        });

        it('get country from merchant app setting \'sfccSiteDefaultCountryCode\'', function () {
            assert.equal(globaleCountryHelpers.getRequestCountryCode(), 'GB');
        });
    });

    describe('getRequestCurrencyCode', function () {
        it('isFunction', function () {
            assert.isFunction(globaleCountryHelpers.getRequestCurrencyCode);
        });

        it('get currency from special Global-e headers', function () {
            request.httpHeaders.set('x-globale-currency', 'USD');
            assert.equal(globaleCountryHelpers.getRequestCurrencyCode(), 'USD');
            request.httpHeaders.set('x-globale-currency', null);
        });

        it('get currency from HTTP parameter submitted in OCAPI/SCAPI context', function () {
            request.httpParameters.set('glCurrency', ['AUD']);
            assert.equal(globaleCountryHelpers.getRequestCurrencyCode(), 'AUD');
            request.httpParameters.remove('glCurrency');
        });

        it('get currency from the parameter in the request URL', function () {
            request.httpParameterMap.set('glCurrency', { value: 'CAD' });
            assert.equal(globaleCountryHelpers.getRequestCurrencyCode(), 'CAD');
            request.httpParameterMap.remove('glCurrency');
        });

        it('get currency from previous request, existing cookies', function () {
            var geCookie = { currencyCode: 'CAD' };
            assert.equal(globaleCountryHelpers.getRequestCurrencyCode(geCookie), 'CAD');
        });

        it('null if no currency', function () {
            var geCookie = { currencyCode: 'RUB' };
            assert.equal(globaleCountryHelpers.getRequestCurrencyCode(geCookie), null);
        });
    });

    describe('getCurrencyCode', function () {
        it('isFunction', function () {
            assert.isFunction(globaleCountryHelpers.getCurrencyCode);
        });

        var geCountryObj = null;
        var requestCurrencyCode = null;
        var isCountryChanged = null;
        it('use session currency code', function () {
            geCountryObj = { isOperatedByGlobalE: false };
            requestCurrencyCode = null;
            isCountryChanged = false;
            session.currency.currencyCode = 'CAD';
            assert.equal(globaleCountryHelpers.getCurrencyCode(geCountryObj, requestCurrencyCode, isCountryChanged), 'CAD');
            session.currency.currencyCode = 'GBP';
        });

        it('use country default currency code', function () {
            // requestCurrencyCode is null
            geCountryObj = { code: 'US', isOperatedByGlobalE: true, defaultCurrencyCode: 'USD' };
            requestCurrencyCode = null;
            isCountryChanged = false;
            assert.equal(globaleCountryHelpers.getCurrencyCode(geCountryObj, requestCurrencyCode, isCountryChanged), 'USD');

            // requestCurrencyCode is not null, supportsFixedPrices is true
            requestCurrencyCode = 'GBP';
            isCountryChanged = false;
            geCountryObj.supportsFixedPrices = true;
            assert.equal(globaleCountryHelpers.getCurrencyCode(geCountryObj, requestCurrencyCode, isCountryChanged), 'USD');

            // requestCurrencyCode is not null, supportsFixedPrices is false, geResetCurrencyCodeOnCountryChange is true, isCountryChanged is true
            requestCurrencyCode = 'GBP';
            isCountryChanged = true;
            geCountryObj.supportsFixedPrices = false;
            globaleHelpers.setPreference('geResetCurrencyCodeOnCountryChange', true);
            assert.equal(globaleCountryHelpers.getCurrencyCode(geCountryObj, requestCurrencyCode, isCountryChanged), 'USD');

            // requestCurrencyCode is not null, supportsFixedPrices is false, geResetCurrencyCodeOnCountryChange is true, isCountryChanged is false
            requestCurrencyCode = 'GBP';
            isCountryChanged = false;
            geCountryObj.supportsFixedPrices = false;
            globaleHelpers.setPreference('geResetCurrencyCodeOnCountryChange', true);
            assert.equal(globaleCountryHelpers.getCurrencyCode(geCountryObj, requestCurrencyCode, isCountryChanged), 'GBP');
        });

        it('use request currency code', function () {
            geCountryObj.supportsFixedPrices = false;
            geCountryObj.code = 'AU';
            globaleHelpers.setPreference('geResetCurrencyCodeOnCountryChange', false);
            requestCurrencyCode = 'AUD';
            isCountryChanged = false;
            assert.equal(globaleCountryHelpers.getCurrencyCode(geCountryObj, requestCurrencyCode, isCountryChanged), 'AUD');
        });

        it('use session currency code as a fallback', function () {
            session.currency.currencyCode = 'CAD';
            geCountryObj.supportsFixedPrices = false;
            geCountryObj.code = 'CA';
            globaleHelpers.setPreference('geResetCurrencyCodeOnCountryChange', false);
            requestCurrencyCode = 'RUB';
            isCountryChanged = false;
            assert.equal(globaleCountryHelpers.getCurrencyCode(geCountryObj, requestCurrencyCode, isCountryChanged), 'CAD');
        });
    });

    describe('getDefaultVATRateType', function () {
        it('isFunction', function () {
            assert.isFunction(globaleCountryHelpers.getDefaultVATRateType);
        });

        var geCountryObj = { defaultVATRateType: '{ "Rate": "20" }' };
        it('valid JSON', function () {
            assert.equal(globaleCountryHelpers.getDefaultVATRateType(geCountryObj), '20');
        });

        it('invalid JSON', function () {
            geCountryObj.defaultVATRateType = '{ "Rate": "20"';
            assert.equal(globaleCountryHelpers.getDefaultVATRateType(geCountryObj), null);
            assert.include(logger.getMessages().error, 'getDefaultVATRateType: {0}', 'no error message');
        });
    });

    describe('getRedirectUrl', function () {
        it('isFunction', function () {
            assert.isFunction(globaleCountryHelpers.getRedirectUrl);
        });

        it('countryCode doesn\'t exist', function () {
            assert.equal(globaleCountryHelpers.getRedirectUrl(), 'https://www.example.com/RefArchGlobal/en_GB/Home-Show');
        });

        it('countryCode exists but not valid', function () {
            request.httpParameterMap.set('countryCode', { rawValue: 'UA' });
            assert.equal(globaleCountryHelpers.getRedirectUrl(), 'https://www.example.com/RefArchGlobal/en_GB/Home-Show?glCountry=UA');
            request.httpParameterMap.remove('countryCode');
        });

        it('countryCode exists and valid, real URL', function () {
            request.httpParameterMap.set('countryCode', { rawValue: 'AU' });
            assert.equal(globaleCountryHelpers.getRedirectUrl(), 'https://www.example.com.au');
            request.httpParameterMap.remove('countryCode');
        });

        it('countryCode exists and valid, URL template Home-Show|RefArchGlobal|default', function () {
            request.httpParameterMap.set('countryCode', { rawValue: 'US' });
            request.httpParameterMap.set('currencyCode', { rawValue: 'USD' });
            assert.equal(globaleCountryHelpers.getRedirectUrl(), 'https://www.example.com/RefArch/en_US/Home-Show?glCountry=US&glCurrency=USD');
            request.httpParameterMap.remove('countryCode');
            request.httpParameterMap.remove('currencyCode');
        });

        it('countryCode exists and valid, URL template Home-Show|RefArchGlobal|default|host', function () {
            request.httpParameterMap.set('countryCode', { rawValue: 'CA' });
            request.httpParameterMap.set('currencyCode', { rawValue: 'CAD' });
            assert.equal(globaleCountryHelpers.getRedirectUrl(), 'https://www.example.ca/RefArch/en_CA/Home-Show?glCountry=CA&glCurrency=CAD');
            request.httpParameterMap.remove('countryCode');
            request.httpParameterMap.remove('currencyCode');
        });

        it('countryCode exists and valid, URL template Home-Show|RefArchGlobal|default|www.example.fr|redirect=false', function () {
            request.httpParameterMap.set('countryCode', { rawValue: 'FR' });
            request.httpParameterMap.set('currencyCode', { rawValue: 'EUR' });
            assert.equal(globaleCountryHelpers.getRedirectUrl(), 'https://www.example.fr/RefArch/en_FR/Home-Show?redirect=false&location=fr&glCountry=FR&glCurrency=EUR');
            request.httpParameterMap.remove('countryCode');
            request.httpParameterMap.remove('currencyCode');
        });

        it('countryCode exists and valid, URL template Home-Show|RefArchGlobal|default|null|redirect=false', function () {
            request.httpParameterMap.set('countryCode', { rawValue: 'DE' });
            request.httpParameterMap.set('currencyCode', { rawValue: 'EUR' });
            assert.equal(globaleCountryHelpers.getRedirectUrl(), 'https://www.example.com/RefArch/en_DE/Home-Show?redirect=false&glCountry=DE&glCurrency=EUR');
            request.httpParameterMap.remove('countryCode');
            request.httpParameterMap.remove('currencyCode');
        });
    });
});
