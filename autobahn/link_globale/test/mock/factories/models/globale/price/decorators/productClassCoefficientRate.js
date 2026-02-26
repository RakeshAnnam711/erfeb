'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../../../cartridges/';
var productClassCoefficientRate = proxyquire(cartridgesBasePath + 'int_globale/cartridge/models/globale/price/decorators/productClassCoefficientRate', {
    '*/cartridge/models/globale/session': require('../../session'),
    '*/cartridge/scripts/helpers/globaleHelpers': require('../../../../scripts/helpers/globaleHelpers'),
    '*/cartridge/scripts/util/globale/object': require('../../../../scripts/util/globale/object'),
    '*/cartridge/scripts/factories/globale/geProductClassCoefficientsMgr': require('../../../../scripts/factories/globale/geProductClassCoefficientsMgr')
});

module.exports = productClassCoefficientRate;
