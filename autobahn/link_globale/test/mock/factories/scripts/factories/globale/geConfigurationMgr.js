'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../../cartridges/';

var geConfigurationMgr = proxyquire(cartridgesBasePath + 'int_globale/cartridge/scripts/factories/globale/geConfigurationMgr', {
    '*/cartridge/scripts/helpers/globaleHelpers': require('../../helpers/globaleHelpers'),
    '*/cartridge/scripts/factories/globale/geAppSettingsMgr': require('./geAppSettingsMgr'),
    '*/cartridge/models/globale/config/LanguageSwitcherConfig': require('../../../models/globale/config/LanguageSwitcherConfig'),
    '*/cartridge/models/globale/config/ShippingSwitcherConfig': require('../../../models/globale/config/ShippingSwitcherConfig')
});

module.exports = geConfigurationMgr;
