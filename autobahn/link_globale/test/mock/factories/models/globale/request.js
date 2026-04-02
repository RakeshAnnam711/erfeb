'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
global.request = require('../../../request');

module.exports = proxyquire('../../../../../cartridges/int_globale/cartridge/models/globale/request', {
    'dw/system/Transaction': require('../../../dw/system/Transaction')
});
