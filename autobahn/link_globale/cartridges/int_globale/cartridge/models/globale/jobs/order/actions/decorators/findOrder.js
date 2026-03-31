'use strict';

/**
 * Returns SFCC order
 * @throws {Error}
 * @param {string} orderNo - order No
 * @returns {dw.order.Order} - SFCC order
 */
function findOrder(orderNo) {
    var OrderMgr = require('dw/order/OrderMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    // check if order exists
    var orderQuery = 'orderNo = {0} OR custom.' + globaleHelpers.customAttr.order.geOrderNumber + ' = {1}';
    var order = OrderMgr.searchOrder(orderQuery, orderNo, orderNo);
    if (!order) {
        throw Error('Order ' + orderNo + ' was not found.');
    }

    return order;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        findOrder: {
            enumerable: true,
            value: findOrder
        }
    });
};
