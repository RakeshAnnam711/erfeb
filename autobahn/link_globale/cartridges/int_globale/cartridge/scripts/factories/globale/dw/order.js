'use strict';

module.exports = {
    get: function (order) {
        if (!order) {
            throw Error('order shouldn\'t be null');
        }

        var geOrder = Object.create(order);
        var decorators = require('*/cartridge/models/globale/dw/order/decorators/index'); // eslint-disable-line no-unused-vars
        decorators.geIsGeOrder(geOrder);
        decorators.geIsSkipOrder(geOrder);
        decorators.geIsMixedMainOrder(geOrder);
        decorators.geGetMixedSubOrders(geOrder);
        decorators.geGetOrderPlis(geOrder);
        decorators.geGetProductDiscounts(geOrder);
        decorators.geGetOrderTotal(geOrder);
        decorators.geGetOrderShippingCost(geOrder);
        decorators.geGetOrderLevelDiscountTotal(geOrder);
        decorators.getProductQuantityTotal(geOrder);

        return geOrder;
    }
};
