'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../../cartridges/';

var checkoutCouponCode = proxyquire(cartridgesBasePath + 'int_globale/cartridge/scripts/factories/globale/checkoutCouponCode', {
    '*/cartridge/scripts/helpers/globaleHelpers': require('../../helpers/globaleHelpers')
});

module.exports = checkoutCouponCode;
