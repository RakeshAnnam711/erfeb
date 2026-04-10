'use strict';

/**
 * @throws {Error}
 * @param {string} order - order
 */
function cancelOrder(order) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var logger = globaleHelpers.getLogger();

    try {
        Transaction.wrap(function () {
            OrderMgr.cancelOrder(order);
        });
    } catch (error) {
        logger.error('ORDER_CANCELATION: {0}', error.message + '; ' + error.stack);
        throw Error(error);
    }
}

module.exports = function (object) {
    Object.defineProperties(object, {
        cancelOrder: {
            enumerable: true,
            value: cancelOrder
        }
    });
};
