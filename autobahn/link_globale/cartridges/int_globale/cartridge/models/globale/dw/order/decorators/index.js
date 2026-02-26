'use strict';

module.exports = {
    geIsGeOrder: require('*/cartridge/models/globale/dw/order/decorators/geIsGeOrder'),
    geIsMixedMainOrder: require('*/cartridge/models/globale/dw/order/decorators/geIsMixedMainOrder'),
    geGetMixedSubOrders: require('*/cartridge/models/globale/dw/order/decorators/geGetMixedSubOrders'),
    geGetOrderPlis: require('*/cartridge/models/globale/dw/order/decorators/geGetOrderPlis'),
    geGetProductDiscounts: require('*/cartridge/models/globale/dw/order/decorators/geGetProductDiscounts'),
    geGetOrderTotal: require('*/cartridge/models/globale/dw/order/decorators/geGetOrderTotal'),
    geGetOrderShippingCost: require('*/cartridge/models/globale/dw/order/decorators/geGetOrderShippingCost'),
    geGetOrderLevelDiscountTotal: require('*/cartridge/models/globale/dw/order/decorators/geGetOrderLevelDiscountTotal'),
    getProductQuantityTotal: require('*/cartridge/models/globale/dw/order/decorators/getProductQuantityTotal'),
    geIsSkipOrder: require('*/cartridge/models/globale/dw/order/decorators/geIsSkipOrder')
};
