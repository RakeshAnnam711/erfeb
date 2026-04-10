'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../../../cartridges/';
var mocksBasePath = '../../../../../../mock/';
var webStoreCodes = proxyquire(cartridgesBasePath + 'int_globale/cartridge/models/globale/sendCart/decorators/webStoreCodes', {
    'dw/system/Site': require(mocksBasePath + 'dw/system/Site'),
    'dw/system/System': require(mocksBasePath + 'dw/system/System'),
    '*/cartridge/models/globale/request': require('../../../../models/globale/request')
});

module.exports = webStoreCodes;
