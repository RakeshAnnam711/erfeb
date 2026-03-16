'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

module.exports = proxyquire('../../../../../../cartridges/int_globale/cartridge/models/globale/checkoutApplyCoupon/AbstractStrategy', {
    '*/cartridge/scripts/helpers/globaleHelpers': require('../../../scripts/helpers/globaleHelpers'),
    '*/cartridge/scripts/helpers/globaleCAPIHelpers': require('../../../scripts/helpers/globaleCAPIHelpers'),
    '*/cartridge/scripts/globale/services/service': require('../../../../factories/scripts/globale/services/service'),
    '*/cartridge/scripts/factories/globale/crypto': require('../../../../factories/scripts/factories/globale/crypto'),
    'dw/system/System': require('../../../../dw/system/System'),
    'dw/system/Site': require('../../../../dw/system/Site')
});
