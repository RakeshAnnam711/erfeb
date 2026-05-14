'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../cartridges/';
var mocksBasePath = '../../../../mock/';
var globaleHooksHelper = proxyquire(cartridgesBasePath + 'int_globale/cartridge/scripts/helpers/globaleHooksHelper', {
    'dw/system/HookMgr': require(mocksBasePath + 'dw/system/HookMgr'),
    '*/cartridge/scripts/helpers/globaleHelpers': require('./globaleHelpers')
});

module.exports = globaleHooksHelper;
