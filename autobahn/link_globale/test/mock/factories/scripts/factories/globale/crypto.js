'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../../cartridges/';

var crypto = proxyquire(cartridgesBasePath + 'int_globale/cartridge/scripts/factories/globale/crypto', {
    '*/cartridge/models/globale/crypto/RSA': require('../../../models/globale/crypto/RSA'),
    '*/cartridge/models/globale/crypto/AES': require('../../../models/globale/crypto/AES')
});

module.exports = crypto;
