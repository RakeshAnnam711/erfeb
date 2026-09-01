'use strict';

var mockFactories = require('../../../../../mock/factories/index');
var assert = require('chai').assert;
var values = mockFactories.scripts.util.globale.values;

describe('util/globale/values.js', function () {
    describe('getValueOrEmptyStringIfNull', function () {
        it('function', function () {
            assert.isFunction(values.getValueOrEmptyStringIfNull);
        });
    });

    describe('getBooleanValueFromString', function () {
        it('function', function () {
            assert.isFunction(values.getBooleanValueFromString);
        });
    });

    describe('getJsonObjectFromString', function () {
        it('function', function () {
            assert.isFunction(values.getJsonObjectFromString);
        });
    });
});
