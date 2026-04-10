'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');

/**
 * Queries for orders modified after a date time
 * @param {Date} modifiedAfterDateTime - date to query orders modified after
 * @return {dw.util.SeekableIterator<dw.order.Order>} orders modified after datetime
 */
function getOrdersModifiedAfterDateTime(modifiedAfterDateTime) {
    return OrderMgr.searchOrders(
        '(status={0} OR status={1} OR status={2} OR status={3}) AND paymentStatus={4} AND lastModified>={5}',
        'creationDate desc',
        Order.ORDER_STATUS_NEW,
        Order.ORDER_STATUS_OPEN,
        Order.ORDER_STATUS_COMPLETED,
        Order.ORDER_STATUS_CANCELLED,
        Order.PAYMENT_STATUS_PAID,
        modifiedAfterDateTime.toISOString()
     );
}

/**
 * Queries for orders created between date times
 * @param {Date} createdAfterDate - date to query orders created after
 * @param {Date} createdBeforeDate - date to query orders created before
 * @return {dw.util.SeekableIterator<dw.order.Order>} orders created in time frame
 */
function getOrdersCreatedBetweenDates(createdAfterDate, createdBeforeDate) {
    return OrderMgr.searchOrders(
        '(status={0} OR status={1} OR status={2} OR status={3}) AND paymentStatus={4} AND creationDate>={5} AND creationDate<={6}',
        'creationDate desc',
        Order.ORDER_STATUS_NEW,
        Order.ORDER_STATUS_OPEN,
        Order.ORDER_STATUS_COMPLETED,
        Order.ORDER_STATUS_CANCELLED,
        Order.PAYMENT_STATUS_PAID,
        createdAfterDate.toISOString(),
        createdBeforeDate.toISOString()
     );
}

module.exports = {
    getOrdersModifiedAfterDateTime: getOrdersModifiedAfterDateTime,
    getOrdersCreatedBetweenDates: getOrdersCreatedBetweenDates
};
