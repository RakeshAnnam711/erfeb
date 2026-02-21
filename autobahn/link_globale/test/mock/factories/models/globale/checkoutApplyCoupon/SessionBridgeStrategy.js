'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

module.exports = proxyquire('../../../../../../cartridges/int_globale/cartridge/models/globale/checkoutApplyCoupon/SessionBridgeStrategy', {
    '*/cartridge/models/globale/checkoutApplyCoupon/AbstractStrategy': require('./AbstractStrategy'),
    '*/cartridge/scripts/factories/globale/geServiceMgr': require('../../../scripts/factories/globale/geServiceMgr'),
    '*/cartridge/scripts/helpers/globaleHelpers': require('../../../scripts/helpers/globaleHelpers'),
    '*/cartridge/scripts/helpers/globaleCAPIHelpers': require('../../../scripts/helpers/globaleCAPIHelpers'),
    '*/cartridge/scripts/util/globale/array': require('../../../scripts/util/globale/array'),
    '*/cartridge/scripts/helpers/globaleHooksHelper': require('../../../scripts/helpers/globaleHooksHelper'),
    'dw/system/HookMgr': require('../../../../dw/system/HookMgr'),
    '*/cartridge/scripts/util/globale/url': require('../../../scripts/util/globale/url')
});
