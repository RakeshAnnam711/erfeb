'use strict';

var mockFactories = require('../../../../mock/factories/index');
var assert = require('chai').assert;
var request = mockFactories.models.globale.request;
var session = mockFactories.models.globale.session;

describe('models/globale/session.js', function () {
    describe('set/get', function () {
        it('should set session custom attribute', function () {
            session.setDefaults();
            session.set('geEnabled', true);
            assert.equal(session.get('geEnabled'), true);
        });
    });

    describe('getCurrency', function () {
        assert.deepEqual(session.getCurrency(), { currencyCode: 'GBP' });
    });

    describe('getUserName', function () {
        assert.equal(session.getUserName(), 'fakeName');
    });

    describe('setDefaults', function () {
        it('should set default values to the session', function () {
            request.set('locale', 'en_GB');
            session.setDefaults();

            assert.deepEqual(global.session, {
                currency: { currencyCode: 'GBP' },
                userName: 'fakeName',
                custom: {
                    geEnabled: false,
                    geOperatedCountry: false,
                    gePriceStrategy: 'DYNAMIC',
                    geUseFixedPricesOnly: false,
                    geCountry: 'GB',
                    geCountryName: 'United Kingdom',
                    geCurrency: 'GBP',
                    geCulture: 'en-GB',
                    geLocale: 'en_GB',
                    geApiVersion: '',
                    geUseCountryVAT: false,
                    geDefaultCountryVATRate: null,
                    geCountryCoefficientIncludeVAT: null
                }
            });
        });
    });
});
