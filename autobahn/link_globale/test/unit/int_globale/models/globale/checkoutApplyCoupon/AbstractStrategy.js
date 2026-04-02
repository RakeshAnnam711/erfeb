'use strict';

var mockFactories = require('../../../../../mock/factories/index');
var assert = require('chai').assert;
var AbstractStrategy = mockFactories.models.globale.checkoutApplyCoupon.AbstractStrategy;

describe('models/globale/checkoutApplyCoupon/AbstractStrategy.js', function () {
    describe('AbstractStrategy', function () {
        it('function: AbstractStrategy', function () {
            assert.isFunction(AbstractStrategy);
        });
    });

    var abstractStrategy = new AbstractStrategy('basketId', 'token', {});
    describe('AbstractStrategy:object', function () {
        it('object: abstractStrategy', function () {
            assert.isObject(abstractStrategy);
        });
    });

    describe('AbstractStrategy:apply', function () {
        it('function: apply', function () {
            assert.isFunction(abstractStrategy.apply);
        });

        it('throws: apply', function () {
            assert.throws(abstractStrategy.apply, 'apply function must be implemented by subclass!');
        });
    });

    describe('AbstractStrategy:remove', function () {
        it('function: remove', function () {
            assert.isFunction(abstractStrategy.remove);
        });

        it('throws: remove', function () {
            assert.throws(abstractStrategy.remove, 'remove function must be implemented by subclass!');
        });
    });
});
