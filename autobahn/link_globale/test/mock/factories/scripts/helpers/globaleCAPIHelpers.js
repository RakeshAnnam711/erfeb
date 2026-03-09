'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../cartridges/';
var mocksBasePath = '../../../../mock/';

var globaleCAPIHelpers = proxyquire(cartridgesBasePath + 'int_globale/cartridge/scripts/helpers/globaleCAPIHelpers', {
    'dw/system/Site': require(mocksBasePath + 'dw/system/Site'),
    'dw/system/System': require(mocksBasePath + 'dw/system/System'),
    '*/cartridge/scripts/helpers/globaleHelpers': require('./globaleHelpers'),
    '*/cartridge/scripts/util/globale/array': require('../util/globale/array'),
    '*/cartridge/models/globale/request': require('../../models/globale/request')
});

module.exports = globaleCAPIHelpers;
