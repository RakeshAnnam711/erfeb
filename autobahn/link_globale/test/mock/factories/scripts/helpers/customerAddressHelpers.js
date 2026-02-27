'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../cartridges/';
var mocksBasePath = '../../../../mock/';

var customerAddressHelpers = proxyquire(cartridgesBasePath + 'int_globale/cartridge/scripts/helpers/customerAddressHelpers', {
    'dw/crypto/Encoding': require(mocksBasePath + 'dw/crypto/Encoding')
});

module.exports = customerAddressHelpers;
