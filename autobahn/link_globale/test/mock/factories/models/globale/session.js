'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
global.request = require('../../../request');
global.session = require('../../../session');

var geSession = proxyquire('../../../../../cartridges/int_globale/cartridge/models/globale/session', {
    'dw/util/Locale': require('../../../dw/util/Locale'),
    '*/cartridge/scripts/helpers/globaleHelpers': require('../../../../mock/factories/scripts/helpers/globaleHelpers')
});

geSession.setDefaults();

module.exports = geSession;
