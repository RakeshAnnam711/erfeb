'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

module.exports = proxyquire('../../../../../../cartridges/int_globale/cartridge/models/globale/config/LanguageSwitcherConfig', {
    '*/cartridge/models/globale/config/AbstractConfig': require('./AbstractConfig'),
    '*/cartridge/scripts/util/globale/object': require('../../../scripts/util/globale/object'),
    '*/cartridge/scripts/util/globale/memoization': require('../../../scripts/util/globale/memoization')
});
