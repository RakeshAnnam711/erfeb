'use strict';

var mockFactories = require('../../../../mock/factories/index');
var assert = require('chai').assert;
var culture = mockFactories.models.globale.culture;

describe('models/globale/culture.js', function () {
    describe('getGlobaleCultureCode', function () {
        it('Function', function () {
            assert.isFunction(culture.getGlobaleCultureCode);
        });

        it('getGlobaleCultureCode is not configured, returned default value "en"', function () {
            assert.equal(culture.getGlobaleCultureCode(), 'en');
        });

        it('LocaleID mapping exists', function () {
            assert.equal(culture.getGlobaleCultureCode(null, 'en_GB'), 'en-GB');
        });

        it('LocaleID mapping does not exist, returned default value "en"', function () {
            assert.equal(culture.getGlobaleCultureCode(null, 'en_FR'), 'en');
        });

        it('CountryCode mapping exists', function () {
            assert.equal(culture.getGlobaleCultureCode('CH'), 'fr');
        });

        it('CountryCode mapping does not exist but country exists, returned country culture code', function () {
            assert.equal(culture.getGlobaleCultureCode('FR'), 'fr');
        });

        it('CountryCode mapping and country do not exist, returned default value "en"', function () {
            assert.equal(culture.getGlobaleCultureCode('US', 'en_US'), 'en');
        });
    });

    describe('getGlobaleCheckoutCultureCode', function () {
        it('Function', function () {
            assert.isFunction(culture.getGlobaleCheckoutCultureCode);
        });

        it('geCheckoutCultureMapping is not configured, returned default value "en"', function () {
            assert.equal(culture.getGlobaleCheckoutCultureCode(), 'en');
        });

        it('LocaleID mapping exists', function () {
            assert.equal(culture.getGlobaleCheckoutCultureCode(null, 'en_GB'), 'en-GB');
        });

        it('LocaleID mapping and locale do not exist, returned default value "en"', function () {
            assert.equal(culture.getGlobaleCheckoutCultureCode(null, 'en_FR'), 'en');
        });

        it('CountryCode mapping exists', function () {
            assert.equal(culture.getGlobaleCheckoutCultureCode('US'), 'en-US');
        });

        it('CountryCode mapping does not exist, returned default value "en"', function () {
            assert.equal(culture.getGlobaleCheckoutCultureCode('FR'), 'en');
        });
    });
});
