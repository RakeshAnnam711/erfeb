'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../cartridges/';

global.session = require('../../../session');
var globaleCountryHelpers = proxyquire(cartridgesBasePath + 'int_globale/cartridge/scripts/helpers/globaleCountryHelpers', {
    'dw/system/Site': require('../../../dw/system/Site'),
    'dw/util/Locale': require('../../../dw/util/Locale'),
    'dw/web/URLAction': require('../../../dw/web/URLAction'),
    'dw/web/URLUtils': require('../../../dw/web/URLUtils'),
    '*/cartridge/scripts/helpers/globaleHelpers': require('./globaleHelpers'),
    '*/cartridge/models/globale/request': require('../../models/globale/request'),
    '*/cartridge/scripts/factories/globale/geCountryMgr': require('../../scripts/factories/globale/geCountryMgr'),
    '*/cartridge/scripts/factories/globale/geCurrencyMgr': require('../../scripts/factories/globale/geCurrencyMgr'),
    '*/cartridge/scripts/factories/globale/geAppSettingsMgr': require('../../scripts/factories/globale/geAppSettingsMgr'),
    '*/cartridge/scripts/factories/globale/geConfigurationMgr': require('../../scripts/factories/globale/geConfigurationMgr')
});

module.exports = globaleCountryHelpers;
