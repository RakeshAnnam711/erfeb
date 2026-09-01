'use strict';

/**
 * Returns SFCC Order
 * @param {string} orderId - SFCC order ID
 * @returns {dw.order.Order|null} - SFCC order or null
 */
function findOrder(orderId) {
    var OrderMgr = require('dw/order/OrderMgr');
    return orderId ? OrderMgr.getOrder(orderId) : null;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        findOrder: {
            value: findOrder
        }
    });
};
