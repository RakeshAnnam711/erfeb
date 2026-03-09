'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../../cartridges/';
var objectUtils = proxyquire(cartridgesBasePath + 'int_globale/cartridge/scripts/util/globale/object', {});

module.exports = objectUtils;
