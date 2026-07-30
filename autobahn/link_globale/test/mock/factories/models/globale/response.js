'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
global.response = require('../../../response');

module.exports = proxyquire('../../../../../cartridges/int_globale/cartridge/models/globale/response', {});
