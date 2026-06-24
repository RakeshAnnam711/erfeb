'use strict';

/**
 * Returns collection of order product line items
 * @returns {dw.util.Collection} - collection of order product line items
 */
function geGetOrderPlis() {
    var order = this;
    var result = order.productLineItems;

    // handle Mixed order scenario
    if (order.geIsMixedMainOrder()) {
        order.geGetMixedSubOrders().forEach(function (subOrder) {
            result.addAll(subOrder.productLineItems);
        });
    }

    return result;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geGetOrderPlis: {
            value: geGetOrderPlis
        }
    });
};
