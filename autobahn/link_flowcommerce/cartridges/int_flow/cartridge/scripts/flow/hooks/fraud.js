'use strict';

var Status = require('dw/system/Status');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');

var logger = FlowHelper.logger;

/**
 * Handles a approved Fraud Status on a SFCC Order
 * @param {dw.order.Order} order - SFCC Order
 */
exports.approved = function (order) {
    var Order = require('dw/order/Order');

    Transaction.wrap(function () {
        var placeOrderStatus = OrderMgr.placeOrder(order);

        if (placeOrderStatus === Status.ERROR) {
            logger.error('Error Placing Order: ' + order.orderNo + ', ' + placeOrderStatus.message);
            FlowHelper.createNotificationObject({
                sfccOrderId: order.orderNo,
                notification: 'Error placing SFCC Order',
                data: placeOrderStatus.message
            });
        } else {
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
            order.setExportStatus(Order.EXPORT_STATUS_READY);
        }
    });
};

/**
 * Handles a declined Fraud Status on a SFCC Order
 * @param {dw.order.Order} order - SFCC Order
 */
exports.declined = function (order) {
    Transaction.wrap(function () {
        var failOrderStatus = OrderMgr.failOrder(order, false);

        if (failOrderStatus === Status.ERROR) {
            logger.error('Error Failing Order: ' + order.orderNo + ', ' + failOrderStatus.message);
        }
    });
};
