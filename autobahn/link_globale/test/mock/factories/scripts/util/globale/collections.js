'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../../cartridges/';
var collections = proxyquire(cartridgesBasePath + 'int_globale/cartridge/scripts/util/globale/collections', {
    'dw/util/ArrayList': require('../../../../dw/util/ArrayList')
});

module.exports = collections;
