'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../../../../cartridges/';
var productAttribute = proxyquire(cartridgesBasePath + 'int_globale/cartridge/models/globale/sendCart/product/decorators/productAttribute', {
    '*/cartridge/scripts/util/globale/object': require('../../../../../scripts/util/globale/object'),
    '*/cartridge/scripts/helpers/globaleHelpers': require('../../../../../scripts/helpers/globaleHelpers')
});

module.exports = productAttribute;
