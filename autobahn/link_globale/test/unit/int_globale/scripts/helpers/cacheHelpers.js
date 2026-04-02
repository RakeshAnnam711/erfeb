'use strict';

var mockFactories = require('../../../../mock/factories/index');
var assert = require('chai').assert;

var cacheHelpers = mockFactories.scripts.helpers.cacheHelpers;
var globaleHelpers = mockFactories.scripts.helpers.globaleHelpers;

describe('scripts/helpers/cacheHelpers.js', function () {
    describe('getSettings', function () {
        it('isFunction', function () {
            assert.isFunction(cacheHelpers.getSettings);
        });

        it('should return empty object if custom preference is not set', function () {
            globaleHelpers.setPreference(globaleHelpers.preferenceKeys.geCustomObjectsCacheSettings, null);
            assert.deepEqual(cacheHelpers.getSettings(), {});
        });

        it('should return configuration object from the site preference', function () {
            var cacheConfiguration = { countries: true, currencies: true, currencyRates: false };
            globaleHelpers.setPreference(globaleHelpers.preferenceKeys.geCustomObjectsCacheSettings, JSON.stringify(cacheConfiguration));
            assert.deepEqual(cacheHelpers.getSettings(), cacheConfiguration);
        });
    });

    describe('isEnabled', function () {
        it('isFunction', function () {
            assert.isFunction(cacheHelpers.isEnabled);
        });

        it('should be true by default (no cache config)', function () {
            globaleHelpers.setPreference(globaleHelpers.preferenceKeys.geCustomObjectsCacheSettings, null);
            assert.equal(cacheHelpers.isEnabled('countries'), true);
        });

        it('should return value from cache config', function () {
            var cacheConfiguration = { countries: true, currencies: true, currencyRates: false };
            globaleHelpers.setPreference(globaleHelpers.preferenceKeys.geCustomObjectsCacheSettings, JSON.stringify(cacheConfiguration));
            assert.equal(cacheHelpers.isEnabled('countries'), true);
            assert.equal(cacheHelpers.isEnabled('currencies'), true);
            assert.equal(cacheHelpers.isEnabled('currencyRates'), false);
        });
    });
});
