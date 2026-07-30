'use strict';

/**
 * Confirms SFCC Order (ORDER_CONFIRMATION_CONFIRMED)
 * @param {dw.order.Order} order - SFCC order
 * @returns {dw.system.Status} - order confirmation status
 */
function confirmOrder(order) {
    var Status = require('dw/system/Status');
    var Order = require('dw/order/Order');

    try {
        if (
            order.getConfirmationStatus().getValue() !== Order.CONFIRMATION_STATUS_CONFIRMED &&
            ([Order.ORDER_STATUS_CANCELLED, Order.ORDER_STATUS_FAILED].indexOf(order.getStatus().getValue()) === -1)
        ) {
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
            this.addNote('Order Confirmation Status has been updated to CONFIRMATION_STATUS_CONFIRMED');
            return new Status(Status.OK);
        }

        this.addNote('Order Confirmation Status has been already updated. Order confirmation status: ' + order.getConfirmationStatus().getDisplayValue());
    } catch (e) {
        return new Status(Status.ERROR, '100', (e.message + '; ' + e.stack));
    }

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'confirmOrder', {
        value: confirmOrder
    });
};
