'use strict';

var AbstractAction = require('*/cartridge/models/globale/generic/AbstractAction');

/**
 * Represents OrderUpdateStatusAction
 * @constructor
 * @param {Object} requestObj - request object
 * @param {Object} responseObj - response object
 */
function OrderUpdateStatusAction(requestObj, responseObj) {
    AbstractAction.call(this, requestObj, responseObj);
    this.order = null;
}

/* Inherits AbstractAction */
OrderUpdateStatusAction.prototype = Object.create(AbstractAction.prototype);

/**
 * Updates order status
 * @throws {Error}
 */
OrderUpdateStatusAction.prototype.run = function () {
    var Transaction = require('dw/system/Transaction');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var systemUtils = require('*/cartridge/scripts/util/globale/system');

    // wait for 2 secs to avoid ORMOptimisticLockingException (refund and cancellation notifications are sent simultaniously)
    systemUtils.sleep(2000);

    // find SFCC order
    var order = this.findOrder(this.request.payload.MerchantOrderId);
    if (!order) {
        this.response.errorCode = 301;
        this.response.errorMessage = 'The order does not exist';
        throw new Error(this.response.errorMessage);
    }

    Transaction.begin();
    try {
        // check GE order number
        if (
            order.custom[globaleHelpers.customAttr.order.geOrderNumber] &&
            order.custom[globaleHelpers.customAttr.order.geOrderNumber] !== this.request.payload.OrderId
        ) {
            this.response.errorCode = 301;
            this.response.errorMessage = 'SFCC GE order number does not match provided value: ' +
                order.custom[globaleHelpers.customAttr.order.geOrderNumber] + '->' +
                this.request.payload.OrderId;
            throw new Error(this.response.errorMessage);
        }

        // update order status
        this.processDecoratorStatus(this.updateOrderStatus(order, this.request.payload), this.response);

        Transaction.commit();
    } catch (e) {
        Transaction.rollback();
        throw e;
    }

    // invoke custom hook
    globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onAfterStatusUpdate, order, this.request.payload);

    // write notes
    this.writeNotes(order, 'GLOBALE_ORDER_STATUS_UPDATE');

    this.response.data.orders.push(order);
    this.response.sfccOrderNumber = order.orderNo;
    this.response.success = true;
};

module.exports = OrderUpdateStatusAction;
