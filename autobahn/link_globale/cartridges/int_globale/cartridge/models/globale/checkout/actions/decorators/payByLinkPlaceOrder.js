'use strict';

/**
 * Places SFCC Order (ORDER_STATUS_NEW)
 * @param {dw.order.Order} order - SFCC order
 */
function placeOrder(order) {
    var OrderMgr = require('dw/order/OrderMgr');

    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    try {
        var placeOrderResult = OrderMgr.placeOrder(order);
        if (placeOrderResult.isError()) {
            throw new Error(placeOrderResult);
        }

        globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.payByLink.onAfterPlaceOrder, order);
    } catch (e) {
        throw new Error(e.message + '; ' + e.stack);
    }
}

module.exports = function (object) {
    Object.defineProperty(object, 'placeOrder', {
        value: placeOrder
    });
};
