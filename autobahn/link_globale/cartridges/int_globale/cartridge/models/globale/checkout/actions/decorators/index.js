'use strict';

var genericDecorators = require('*/cartridge/models/globale/generic/decorators/index');

module.exports = {
    getSendCartData: require('*/cartridge/models/globale/checkout/actions/decorators/getSendCartData'),
    getCartToken: require('*/cartridge/models/globale/checkout/actions/decorators/getCartToken'),
    reserveInventory: require('*/cartridge/models/globale/checkout/actions/decorators/reserveInventory'),
    payByLinkCreateOrder: require('*/cartridge/models/globale/checkout/actions/decorators/payByLinkCreateOrder'),
    payByLinkPlaceOrder: require('*/cartridge/models/globale/checkout/actions/decorators/payByLinkPlaceOrder'),
    processDecoratorStatus: genericDecorators.processDecoratorStatus
};
