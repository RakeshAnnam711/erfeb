'use strict';

var mockFactories = require('../../../../../mock/factories/index');
var assert = require('chai').assert;
var JWTStrategy = mockFactories.models.globale.checkoutApplyCoupon.JWTStrategy;

describe('models/globale/checkoutApplyCoupon/JWTStrategy.js', function () {
    describe('JWTStrategy', function () {
        it('function: JWTStrategy', function () {
            assert.isFunction(JWTStrategy);
        });
    });

    var jwtStrategy = new JWTStrategy('basketId', 'token', {});
    describe('JWTStrategy:object', function () {
        it('object: jwtStrategy', function () {
            assert.isObject(jwtStrategy);
        });
    });

    describe('JWTStrategy:apply', function () {
        it('function: apply', function () {
            assert.isFunction(jwtStrategy.apply);
        });
    });

    describe('JWTStrategy:remove', function () {
        it('function: remove', function () {
            assert.isFunction(jwtStrategy.remove);
        });
    });
});
