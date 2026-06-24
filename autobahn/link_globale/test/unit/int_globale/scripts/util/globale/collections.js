'use strict';

var mockFactories = require('../../../../../mock/factories/index');
var assert = require('chai').assert;
var collections = mockFactories.scripts.util.globale.collections;

describe('util/globale/collections.js', function () {
    describe('map', function () {
        it('function', function () {
            assert.isFunction(collections.map);
        });
    });

    describe('forEach', function () {
        it('function', function () {
            assert.isFunction(collections.forEach);
        });
    });

    describe('concat', function () {
        it('function', function () {
            assert.isFunction(collections.concat);
        });
    });

    describe('reduce', function () {
        it('function', function () {
            assert.isFunction(collections.reduce);
        });
    });

    describe('pluck', function () {
        it('function', function () {
            assert.isFunction(collections.pluck);
        });
    });

    describe('find', function () {
        it('function', function () {
            assert.isFunction(collections.find);
        });
    });

    describe('first', function () {
        it('function', function () {
            assert.isFunction(collections.first);
        });
    });

    describe('every', function () {
        it('function', function () {
            assert.isFunction(collections.every);
        });
    });

    describe('filter', function () {
        it('function', function () {
            assert.isFunction(collections.filter);
        });
    });
});
