'use strict';

/**
 * Returns sub orders of main Mixed Order
 * @returns {array} - array of sub orders
 */
function geGetMixedSubOrders() {
    var OrderMgr = require('dw/order/OrderMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var order = this;
    var result = [];

    if (
        order &&
        (globaleHelpers.customAttr.order.geMixedOrdersSubOrdersIDs in order.custom) &&
        order.custom[globaleHelpers.customAttr.order.geMixedOrdersSubOrdersIDs]
    ) {
        order.custom[globaleHelpers.customAttr.order.geMixedOrdersSubOrdersIDs].split(',').forEach(function (subOrderId) {
            var subOrder = OrderMgr.searchOrder('custom.' + globaleHelpers.customAttr.order.geOrderNumber + ' = {0}', subOrderId);
            if (subOrder) {
                result.push(subOrder);
            }
        });
    }

    return result;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geGetMixedSubOrders: {
            value: geGetMixedSubOrders
        }
    });
};
