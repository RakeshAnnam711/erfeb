'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var ForterLogger = require('../lib/forter/forterLogger');
var ForterCustomerAccount = require('../lib/forter/dto/forterCustomerAccount');
var ForterCustomersService = require('../lib/forter/services/forterCustomersService');
var sitePrefs = require('../../../mocks/dw/system/Site');

function proxyModel() {
    return proxyquire('../../../../cartridges/int_forter_sfra/cartridge/scripts/pipelets/forter/forterCustomerUpdate', {
        '*/cartridge/scripts/lib/forter/forterLogger': ForterLogger,
        '*/cartridge/scripts/lib/forter/dto/forterCustomerAccount': ForterCustomerAccount,
        '*/cartridge/scripts/lib/forter/services/forterCustomersService': ForterCustomersService,
        'dw/system/Site': sitePrefs
    });
}

module.exports = proxyModel();
