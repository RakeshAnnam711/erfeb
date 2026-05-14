'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../../cartridges/';
var values = proxyquire(cartridgesBasePath + 'int_globale/cartridge/scripts/util/globale/values', {});

module.exports = values;
