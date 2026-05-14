'use strict';

var mockFactories = require('../../../../mock/factories/index');
var assert = require('chai').assert;

// var session = mockFactories.models.globale.session;
var globaleHelpers = mockFactories.scripts.helpers.globaleHelpers;
var request = mockFactories.models.globale.request;

describe('scripts/helpers/globaleHelpers.js', function () {
    describe('getLogger', function () {
        it('logger created', function () {
            var logger = globaleHelpers.getLogger();
            assert.isObject(logger);
            assert.isFunction(logger.info);
            assert.isFunction(logger.debug);
            assert.isFunction(logger.warn);
            assert.isFunction(logger.error);
            assert.isFunction(logger.fatal);
            assert.isFunction(logger.message);
        });
    });

    describe('SitePreferences', function () {
        it('getPreference: get custom site preference', function () {
            assert.isFunction(globaleHelpers.getPreference);
            assert.deepEqual(globaleHelpers.getPreference('geDefaultShippingMethod'), 'GLOBALE');
        });

        it('setPreference: set custom site preference and check it\'s value', function () {
            assert.isFunction(globaleHelpers.setPreference);
            globaleHelpers.setPreference('TestPref', 'TestVal');
            assert.equal(globaleHelpers.getPreference('TestPref'), 'TestVal');
        });

        it('getJSONPreference: valid JSON', function () {
            assert.isFunction(globaleHelpers.getJSONPreference);
            globaleHelpers.setPreference('TestPrefJson1', JSON.stringify({ test: 'test' }));
            assert.deepEqual(globaleHelpers.getJSONPreference('TestPrefJson1'), { test: 'test' });
        });

        it('getJSONPreference: invalid JSON', function () {
            globaleHelpers.setPreference('TestPrefJson2', '{ test: \'test\'');
            assert.equal(globaleHelpers.getJSONPreference('TestPrefJson2'), null);
        });

        it('getJSONPreference: empty value', function () {
            globaleHelpers.setPreference('TestPrefJson3', '');
            assert.equal(globaleHelpers.getJSONPreference('TestPrefJson3'), null);
        });
    });

    describe('isGlobaleEnabled', function () {
        it('checks if GE enabled', function () {
            assert.isFunction(globaleHelpers.isGlobaleEnabled);
        });
    });

    describe('isGlobaleRequest', function () {
        it('checks if a request belongs to GE', function () {
            assert.isFunction(globaleHelpers.isGlobaleRequest);
        });
    });

    describe('getGlobaleAppSettings', function () {
        it('get GE app settings', function () {
            assert.isFunction(globaleHelpers.getGlobaleAppSettings);
        });
    });

    describe('getRootPriceBook', function () {
        it('get root price book', function () {
            assert.isFunction(globaleHelpers.getRootPriceBook);
            // assert.fail('@TODO: implement verification logic');
        });
    });

    describe('getProductListPrice', function () {
        it('get product list price', function () {
            assert.isFunction(globaleHelpers.getProductListPrice);
            // assert.fail('@TODO: implement verification logic');
        });
    });

    describe('setSession', function () {
        it('sets GE session', function () {
            assert.isFunction(globaleHelpers.setSession);
            // assert.fail('@TODO: implement verification logic');
        });
    });

    describe('isNotesLimitReached', function () {
        it('checks if a note could be added', function () {
            assert.isFunction(globaleHelpers.isNotesLimitReached);
            // assert.fail('@TODO: implement verification logic');
        });
    });

    describe('getClientSettings', function () {
        it('get client settings', function () {
            assert.isFunction(globaleHelpers.getClientSettings);
            // assert.fail('@TODO: implement verification logic');
        });
    });

    describe('applySearchableProductsPromotion', function () {
        it('applies searchable products promotion', function () {
            assert.isFunction(globaleHelpers.applySearchableProductsPromotion);
        });
    });

    describe('getCookieDomain', function () {
        it('returns cookie domain from httpHost', function () {
            assert.isFunction(globaleHelpers.getCookieDomain);
            request.set('httpHost', 'www.example.com');
            globaleHelpers.setPreference('geCookieDomain', null);
            assert.equal(globaleHelpers.getCookieDomain(), 'www.example.com');
        });

        it('returns cookie domain from config: default', function () {
            globaleHelpers.setPreference('geCookieDomain', JSON.stringify({ defaultDomain: 'www.defaultdomain.com', en_US: 'www.defaultdomain.us' }));
            request.set('locale', 'en_GB');
            assert.equal(globaleHelpers.getCookieDomain(), 'www.defaultdomain.com');
        });

        it('returns cookie domain from config: locale specific', function () {
            request.set('locale', 'en_US');
            assert.equal(globaleHelpers.getCookieDomain(), 'www.defaultdomain.us');
        });
    });
});
