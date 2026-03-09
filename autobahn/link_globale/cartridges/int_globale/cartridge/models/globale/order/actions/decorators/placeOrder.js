'use strict';

/**
 * Places SFCC Order (ORDER_STATUS_NEW)
 * @param {dw.order.Order} order - SFCC order
 * @returns {dw.system.Status} - order placement status
 */
function placeOrder(order) {
    var Status = require('dw/system/Status');
    var Order = require('dw/order/Order');
    var OrderMgr = require('dw/order/OrderMgr');

    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    try {
        var orderStatus = order.getStatus();
        if (orderStatus.getValue() === Order.ORDER_STATUS_CREATED) {
            // invoke custom hook
            globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onBeforePlaceOrder, order, this.request.payload);

            var placeOrderResult = OrderMgr.placeOrder(order);
            if (placeOrderResult.isError()) {
                return new Status(Status.ERROR, '232', placeOrderResult.getMessage());
            }

            // invoke custom hook
            globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onAfterPlaceOrder, order, this.request.payload);

            this.addNote('Order has been placed successfully. Order Status has been updated to ORDER_STATUS_NEW');
            return new Status(Status.OK);
        } if (orderStatus.getValue() === Order.ORDER_STATUS_FAILED) {
            return new Status(Status.ERROR, '232', 'Cannot place Order in status FAILED');
        } if (orderStatus.getValue() === Order.ORDER_STATUS_CANCELLED) {
            return new Status(Status.ERROR, '240', 'Cannot place Order in status CANCELLED');
        }

        this.addNote('Order has been already placed. Order status: ' + orderStatus.getDisplayValue());
    } catch (e) {
        return new Status(Status.ERROR, '100', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'placeOrder', {
        value: placeOrder
    });
};
