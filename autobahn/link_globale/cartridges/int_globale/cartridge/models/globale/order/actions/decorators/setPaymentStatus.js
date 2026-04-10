'use strict';

/**
 * Sets respective Order Payment status
 * @param {dw.order.Order} order - SFCC order
 * @returns {dw.system.Status} - set payment status
 */
function setPaymentStatus(order) {
    var Status = require('dw/system/Status');
    var Order = require('dw/order/Order');

    order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
    this.addNote('Order Payment Status has been updated to PAYMENT_STATUS_PAID');

    return new Status(Status.OK);
}

module.exports = function (object) {
    Object.defineProperty(object, 'setPaymentStatus', {
        value: setPaymentStatus
    });
};
