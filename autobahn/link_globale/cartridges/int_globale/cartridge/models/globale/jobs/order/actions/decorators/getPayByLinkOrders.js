'use strict';

var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var StringUtils = require('dw/util/StringUtils');
var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

/**
 * Returns SFCC orders
 * @throws {Error}
 * @returns {dw.util.SeekableIterator} - SFCC orders
 */
function getPayByLinkOrders() {
    var geConfigurationMgr = require('*/cartridge/scripts/factories/globale/geConfigurationMgr');
    var payByLinkConfig = geConfigurationMgr.getPayByLinkConfig();

    var autoFailOrdersTime = payByLinkConfig.getAutoCancelOrdersTime();

    if (!autoFailOrdersTime) {
        throw Error('The Auto-Fail Orders Time does not configured.');
    }

    var expirationDate = new Date(new Date() - Number(autoFailOrdersTime) * 60000);
    var orderQuery = StringUtils.format(
        'creationDate <= {0} AND paymentStatus = {1} AND (status = {2} OR status = {3}) AND custom.'
        + globaleHelpers.customAttr.order.geIsOrderCreatedPayByLinkScenario
        + ' = true AND custom.'
        + globaleHelpers.customAttr.order.geOrderNumber
        + '= NULL'
    );
    var orders = OrderMgr.searchOrders(
        orderQuery,
        null,
        expirationDate,
        Order.PAYMENT_STATUS_NOTPAID,
        Order.ORDER_STATUS_NEW,
        Order.ORDER_STATUS_OPEN
    );

    return orders;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        getPayByLinkOrders: {
            enumerable: true,
            value: getPayByLinkOrders
        }
    });
};
