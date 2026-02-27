'use strict';

var mockFactories = require('../../../../../mock/factories/index');
var assert = require('chai').assert;
var memoization = mockFactories.scripts.util.globale.memoization;

describe('util/globale/memoization.js', function () {
    describe('memoize', function () {
        it('function', function () {
            assert.isFunction(memoization.memoize);
        });
    });

    describe('getResolverSimpleKey', function () {
        it('function', function () {
            assert.isFunction(memoization.getResolverSimpleKey);
        });
    });
});
