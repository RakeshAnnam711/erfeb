'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../cartridges/';
var mocksBasePath = '../../../../mock/';
var globaleProductHelpers = proxyquire(cartridgesBasePath + 'int_globale/cartridge/scripts/helpers/globaleProductHelpers', {
    'dw/util/LinkedHashSet': require(mocksBasePath + 'dw/util/LinkedHashSet'),
    '*/cartridge/scripts/helpers/globaleHelpers': require('./globaleHelpers'),
    '*/cartridge/scripts/util/globale/collections': require('../util/globale/collections')
});

module.exports = globaleProductHelpers;
