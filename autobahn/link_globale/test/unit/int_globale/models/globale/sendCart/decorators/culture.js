'use strict';

var mockFactories = require('../../../../../../mock/factories/index');
var assert = require('chai').assert;

var request = mockFactories.models.globale.request;
var session = mockFactories.models.globale.session;
var culture = mockFactories.models.globale.sendCart.decorators.culture;

var object = Object.create(null);
culture(object);

describe('models/globale/sendCart/decorators/culture.js', function () {
    describe('getCultureData', function () {
        it('country code', function () {
            request.set('locale', 'en_US');
            session.setDefaults();
            session.set('geCountry', 'US');

            assert.deepEqual(object.getCultureData(), {
                CultureCode: 'en-US',
                InputDataCultureCode: 'en-US',
                PreferedCultureCode: 'en-US'
            });
        });

        it('locale code', function () {
            request.set('locale', 'en_GB');
            session.setDefaults();
            session.set('geCountry', 'GB');

            assert.deepEqual(object.getCultureData(), {
                CultureCode: 'en-GB',
                InputDataCultureCode: 'en-GB',
                PreferedCultureCode: 'en-GB'
            });
        });

        it('default value', function () {
            request.set('locale', null);
            session.setDefaults();
            session.set('geCountry', null);

            assert.deepEqual(object.getCultureData(), {
                CultureCode: 'en',
                InputDataCultureCode: 'en',
                PreferedCultureCode: 'en'
            });
        });
    });
});
