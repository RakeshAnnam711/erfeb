'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../../cartridges/';

var geServiceMgr = proxyquire(cartridgesBasePath + 'int_globale/cartridge/scripts/factories/globale/geServiceMgr', {
    '*/cartridge/scripts/helpers/globaleCAPIHelpers': require('../../helpers/globaleCAPIHelpers'),
    '*/cartridge/scripts/helpers/globaleHelpers': require('../../helpers/globaleHelpers'),
    '*/cartridge/scripts/globale/services/service': require('../../globale/services/service')
});

module.exports = geServiceMgr;
