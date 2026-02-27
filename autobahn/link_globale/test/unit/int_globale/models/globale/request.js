'use strict';

var mockFactories = require('../../../../mock/factories/index');
var assert = require('chai').assert;
var request = mockFactories.models.globale.request;

describe('models/globale/request.js', function () {
    describe('set/get', function () {
        it('set: should set request property', function () {
            request.set('locale', 'en_US');
            assert.equal(global.request.locale, 'en_US');
        });

        it('get: should get request property', function () {
            request.set('locale', 'en_US');
            assert.equal(request.get('locale'), 'en_US');
        });
    });
});
