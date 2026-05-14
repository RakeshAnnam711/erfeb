'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../cartridges/';
var mocksBasePath = '../../../../mock/';
var globaleHelpers = proxyquire(cartridgesBasePath + 'int_globale/cartridge/scripts/helpers/globaleHelpers', {
    'dw/system/Site': require(mocksBasePath + 'dw/system/Site'),
    'dw/system/System': require(mocksBasePath + 'dw/system/System'),
    'dw/system/Logger': require(mocksBasePath + 'dw/system/Logger'),
    'dw/crypto/MessageDigest': require(mocksBasePath + 'dw/crypto/MessageDigest'),
    'dw/util/Bytes': require(mocksBasePath + 'dw/util/Bytes'),
    'dw/crypto/Encoding': require(mocksBasePath + 'dw/crypto/Encoding'),
    'dw/system/Transaction': require('../../../../mock/dw/system/Transaction'),
    '*/cartridge/models/globale/request': require('../../models/globale/request'),
    '*/cartridge/scripts/util/globale/array': require('../util/globale/array'),
    '*/cartridge/scripts/factories/globale/geAppSettingsMgr': require('../../scripts/factories/globale/geAppSettingsMgr')
});

module.exports = globaleHelpers;
