'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../cartridges/';

var cacheHelpers = proxyquire(cartridgesBasePath + 'int_globale/cartridge/scripts/helpers/cacheHelpers', {
    '*/cartridge/scripts/helpers/globaleHelpers': require('./globaleHelpers')
});

module.exports = cacheHelpers;
