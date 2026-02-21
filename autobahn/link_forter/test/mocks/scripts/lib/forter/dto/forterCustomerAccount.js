'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

function proxyModel() {
    return proxyquire('../../../../../../cartridges/int_forter_sfra/cartridge/scripts/lib/forter/dto/forterCustomerAccount', {});
}

module.exports = proxyModel();
