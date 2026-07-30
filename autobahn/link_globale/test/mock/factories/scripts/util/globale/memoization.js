'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../../cartridges/';
var memoizationUtils = proxyquire(cartridgesBasePath + 'int_globale/cartridge/scripts/util/globale/memoization', {});

module.exports = memoizationUtils;
