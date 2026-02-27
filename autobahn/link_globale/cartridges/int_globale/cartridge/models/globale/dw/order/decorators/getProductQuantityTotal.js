'use strict';

/**
 * Returns the order products quantity
 * @returns {number} - order products quantity
 */
function getProductQuantityTotal() {
    var order = this;
    var orders = [order];
    // handle Mixed order scenario
    if (order.geIsMixedMainOrder(order)) {
        orders = orders.concat(order.geGetMixedSubOrders(order));
    }
    var result = 0;

    orders.forEach(function (orderItem) {
        result += orderItem.productQuantityTotal;
    });

    return result;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        getProductQuantityTotal: {
            value: getProductQuantityTotal
        }
    });
};
