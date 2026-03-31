'use strict';

var mockFactories = require('../../../../../mock/factories/index');
var assert = require('chai').assert;
var checkoutCouponCode = mockFactories.scripts.factories.globale.checkoutCouponCode;

/* current test just check the function, coupon apply/remove scenarios are covered by integration tests */

describe('scripts/factories/globale/checkoutCouponCode.js', function () {
    it('checkoutCouponCode:function', function () {
        assert.isFunction(checkoutCouponCode);
    });
});
