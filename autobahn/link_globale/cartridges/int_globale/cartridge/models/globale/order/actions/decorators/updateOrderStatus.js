/* eslint-disable no-param-reassign */

'use strict';

/**
 * Sets Global-e Order Status in Order custom attribute
 * @param {dw.order.Order} order - SFCC order
 * @param {string} statusCode - order status code
 * @param {string} reasonCode - order reason code
 */
function setGlobaleOrderStatus(order, statusCode, reasonCode) {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var statuses = [];
    if (order.custom[globaleHelpers.customAttr.order.geReceivedOrderStatusUpdates].length > 0) {
        Array.prototype.forEach.call(order.custom[globaleHelpers.customAttr.order.geReceivedOrderStatusUpdates], function (record) {
            statuses.push(record);
        });
    }
    statuses.push(statusCode);
    order.custom[globaleHelpers.customAttr.order.geReceivedOrderStatusUpdates] = statuses;

    // set reason code
    switch (statusCode) {
        case 'CANCELLED':
        case 'CUSTOM.CANCELLED':
        case 'FAILED':
            order.custom[globaleHelpers.customAttr.order.geOrderCancellationReasonCode] = reasonCode;
            break;
        default:
            break;
    }
}

/**
 * Sets SFCC Order Status
 * @throws {Error}
 * @param {dw.order.Order} order - SFCC order
 * @param {string} statusCode - order status code
 */
function setSfccOrderStatus(order, statusCode) {
    var Order = require('dw/order/Order');
    var OrderMgr = require('dw/order/OrderMgr');
    var ShippingOrderItem = require('dw/order/ShippingOrderItem');
    var collections = require('*/cartridge/scripts/util/globale/collections');

    switch (statusCode) {
        case 'CANCELLED':
        case 'FAILED':
            if (order.shippingOrderItems && order.shippingOrderItems.size() > 0) { // in case if OrderCenter is enabled, normally ShippingOrderItems are created
                order.setOrderStatus(Order.ORDER_STATUS_CANCELLED);
            } else if (order.status.value === Order.ORDER_STATUS_NEW || order.status.value === Order.ORDER_STATUS_OPEN) { // in case if SFCC order status is "NEW" or "OPEN"
                order.setStatus(Order.ORDER_STATUS_CANCELLED);
            } else if (order.status.value === Order.ORDER_STATUS_CREATED) { // in case if SFCC order status is "CREATED"
                var status = OrderMgr.failOrder(order, false);
                if (status.isError()) {
                    throw Error(status.getMessage());
                }
            }
            break;
        case 'COMPLETED':
            if (order.shippingOrderItems && order.shippingOrderItems.size() > 0) { // in case if OrderCenter is enabled, normally ShippingOrderItems are created
                collections.forEach(order.shippingOrderItems, function (shippingOrderItem) {
                    shippingOrderItem.setStatus(ShippingOrderItem.STATUS_SHIPPED);
                });
            } else {
                order.setStatus(Order.ORDER_STATUS_COMPLETED); // use standard method to set Order COMPLETED status
            }
            break;
        default:
            break;
    }
}

/**
 * Updates SFCC Order Status according to the status received from Global-e
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} payload - request payload
 * @returns {dw.system.Status} - set payment export status
 */
function updateOrderStatus(order, payload) {
    var Status = require('dw/system/Status');
    var objectUtils = require('*/cartridge/scripts/util/globale/object');

    try {
        var statusCode = objectUtils.getValueByPath(payload, 'StatusCode', '').toUpperCase();
        var reasonCode = objectUtils.getValueByPath(payload, 'OrderStatusReason.OrderStatusReasonCode', null);

        // set SFCC order status
        setSfccOrderStatus(order, statusCode);

        // set Global-e order status
        setGlobaleOrderStatus(order, statusCode, reasonCode);

        // add note
        this.addNote('Order Status ' + statusCode + ' has been set to Order');
    } catch (e) {
        return new Status(Status.ERROR, '400', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperties(object, {
        updateOrderStatus: {
            value: updateOrderStatus
        }
    });
};
