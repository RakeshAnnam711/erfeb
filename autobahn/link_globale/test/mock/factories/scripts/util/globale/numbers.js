'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../../cartridges/';
var numbers = proxyquire(cartridgesBasePath + 'int_globale/cartridge/scripts/util/globale/numbers', {});

module.exports = numbers;
