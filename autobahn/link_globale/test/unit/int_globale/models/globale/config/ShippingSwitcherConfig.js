'use strict';

var mockFactories = require('../../../../../mock/factories/index');
var assert = require('chai').assert;
var ShippingSwitcherConfig = mockFactories.models.globale.config.ShippingSwitcherConfig;

describe('models/globale/config/ShippingSwitcherConfig.js', function () {
    describe('ShippingSwitcherConfig', function () {
        it('function: ShippingSwitcherConfig', function () {
            assert.isFunction(ShippingSwitcherConfig);
        });
    });

    var shippingSwitcherConfig = new ShippingSwitcherConfig({});
    describe('ShippingSwitcherConfig:getSiteConfig', function () {
        it('function: getSiteConfig', function () {
            assert.isFunction(shippingSwitcherConfig.getSiteConfig);
        });
    });

    describe('ShippingSwitcherConfig:isRedirectToSamePage', function () {
        it('function: isRedirectToSamePage', function () {
            assert.isFunction(shippingSwitcherConfig.isRedirectToSamePage);
        });
    });

    describe('ShippingSwitcherConfig:isRedirectToSamePageAcrossSites', function () {
        it('function: isRedirectToSamePageAcrossSites', function () {
            assert.isFunction(shippingSwitcherConfig.isRedirectToSamePageAcrossSites);
        });
    });

    describe('ShippingSwitcherConfig:isAddGeParametersToUrl', function () {
        it('function: isAddGeParametersToUrl', function () {
            assert.isFunction(shippingSwitcherConfig.isAddGeParametersToUrl);
        });
    });

    describe('ShippingSwitcherConfig:isShowGeoCountryPopup', function () {
        it('function: isShowGeoCountryPopup', function () {
            assert.isFunction(shippingSwitcherConfig.isShowGeoCountryPopup);
        });
    });

    describe('ShippingSwitcherConfig:getSiteAllowedCountries', function () {
        it('function: getSiteAllowedCountries', function () {
            assert.isFunction(shippingSwitcherConfig.getSiteAllowedCountries);
        });
    });

    describe('ShippingSwitcherConfig:getSiteDisallowedCountries', function () {
        it('function: getSiteDisallowedCountries', function () {
            assert.isFunction(shippingSwitcherConfig.getSiteDisallowedCountries);
        });
    });

    describe('ShippingSwitcherConfig:getLocaleConfig', function () {
        it('function: getLocaleConfig', function () {
            assert.isFunction(shippingSwitcherConfig.getLocaleConfig);
        });
    });

    describe('ShippingSwitcherConfig:getLocaleAllowedCountries', function () {
        it('function: getLocaleAllowedCountries', function () {
            assert.isFunction(shippingSwitcherConfig.getLocaleAllowedCountries);
        });
    });

    describe('ShippingSwitcherConfig:getLocaleDisallowedCountries', function () {
        it('function: getLocaleDisallowedCountries', function () {
            assert.isFunction(shippingSwitcherConfig.getLocaleDisallowedCountries);
        });
    });

    describe('ShippingSwitcherConfig:isStickToLocale', function () {
        it('function: isStickToLocale', function () {
            assert.isFunction(shippingSwitcherConfig.isStickToLocale);
        });
    });
});
