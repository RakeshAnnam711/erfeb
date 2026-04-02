'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../../cartridges/';
var validator = proxyquire(cartridgesBasePath + 'int_globale/cartridge/scripts/util/globale/validator', {
    '*/cartridge/scripts/util/globale/object': require('./object')
});

module.exports = validator;
