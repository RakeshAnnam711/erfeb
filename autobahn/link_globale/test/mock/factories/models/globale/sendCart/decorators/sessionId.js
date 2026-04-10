'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var cartridgesBasePath = '../../../../../../../cartridges/';
var sessionId = proxyquire(cartridgesBasePath + 'int_globale/cartridge/models/globale/sendCart/decorators/getSessionId', {
    '*/cartridge/models/globale/request': require('../../request'),
    '*/cartridge/scripts/factories/globale/crypto': require('../../../../../factories/scripts/factories/globale/crypto'),
    '*/cartridge/scripts/helpers/globaleCAPIHelpers': require('../../../../scripts/helpers/globaleCAPIHelpers')
});

module.exports = sessionId;
