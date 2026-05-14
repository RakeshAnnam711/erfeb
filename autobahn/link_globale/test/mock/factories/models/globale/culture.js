'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

module.exports = proxyquire('../../../../../cartridges/int_globale/cartridge/models/globale/culture', {
    '*/cartridge/scripts/helpers/globaleHelpers': require('../../scripts/helpers/globaleHelpers'),
    '*/cartridge/scripts/factories/globale/geCultureMgr': require('../../scripts/factories/globale/geCultureMgr'),
    '*/cartridge/scripts/factories/globale/geAppSettingsMgr': require('../../scripts/factories/globale/geAppSettingsMgr'),
    'dw/util/Locale': require('../../../dw/util/Locale')
});
