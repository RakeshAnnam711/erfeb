'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

module.exports = proxyquire('../../../../../../cartridges/int_globale/cartridge/scripts/globale/services/service', {
    'dw/svc/LocalServiceRegistry': require('../../../../dw/svc/LocalServiceRegistry')
});
