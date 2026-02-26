'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../../../cartridges/';
var mocksBasePath = '../../../../../../mock/';
var culture = proxyquire(cartridgesBasePath + 'int_globale/cartridge/models/globale/sendCart/decorators/getCultureData', {
    'dw/util/Locale': require(mocksBasePath + 'dw/util/Locale'),
    '*/cartridge/models/globale/session': require('../../session'),
    '*/cartridge/models/globale/request': require('../../request'),
    '*/cartridge/models/globale/culture': require('../../culture')
});

module.exports = culture;
