'use strict';

var mockFactories = require('../../../../../mock/factories/index');
var assert = require('chai').assert;
var SessionBridgeStrategy = mockFactories.models.globale.checkoutApplyCoupon.SessionBridgeStrategy;

describe('models/globale/checkoutApplyCoupon/SessionBridgeStrategy.js', function () {
    describe('SessionBridgeStrategy', function () {
        it('function: SessionBridgeStrategy', function () {
            assert.isFunction(SessionBridgeStrategy);
        });
    });

    var sessionBridgeStrategy = new SessionBridgeStrategy('basketId', '{}', {});
    describe('SessionBridgeStrategy:object', function () {
        it('object: sessionBridgeStrategy', function () {
            assert.isObject(sessionBridgeStrategy);
        });
    });

    describe('SessionBridgeStrategy:apply', function () {
        it('function: apply', function () {
            assert.isFunction(sessionBridgeStrategy.apply);
        });
    });

    describe('SessionBridgeStrategy:remove', function () {
        it('function: remove', function () {
            assert.isFunction(sessionBridgeStrategy.remove);
        });
    });
});
