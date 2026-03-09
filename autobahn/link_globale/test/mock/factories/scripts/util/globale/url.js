'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../../cartridges/';
var url = proxyquire(cartridgesBasePath + 'int_globale/cartridge/scripts/util/globale/url', {});

module.exports = url;
