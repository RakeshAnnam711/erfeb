'use strict';

var AbstractAction = require('*/cartridge/models/globale/generic/AbstractAction');

/**
 * Represents OrderUpdateShippingInfoAction
 * @constructor
 * @param {Object} requestObj - request object
 * @param {Object} responseObj - response object
 */
function OrderUpdateShippingInfoAction(requestObj, responseObj) {
    AbstractAction.call(this, requestObj, responseObj);
    this.order = null;
}

/* Inherits AbstractAction */
OrderUpdateShippingInfoAction.prototype = Object.create(AbstractAction.prototype);

/**
 * Updates order status
 * @throws {Error}
 */
OrderUpdateShippingInfoAction.prototype.run = function () {
    var Transaction = require('dw/system/Transaction');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

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
        if (order.custom[globaleHelpers.customAttr.order.geOrderNumber] !== this.request.payload.OrderId) {
            this.response.errorCode = 301;
            this.response.errorMessage = 'SFCC GE order number does not match provided value: ' +
                order.custom[globaleHelpers.customAttr.order.geOrderNumber] + '->' +
                this.request.payload.OrderId;
            throw new Error(this.response.errorMessage);
        }

        // update order status
        this.processDecoratorStatus(this.updateOrderShippingInfo(order, this.request.payload), this.response);

        // update order shipping address attributes
        this.processDecoratorStatus(this.setGeShippingAddressAttributes(order, this.request.payload), this.response);
        this.processDecoratorStatus(this.setCustomerShippingAddressAttributes(order, this.request.payload), this.response);

        // update order customer address
        this.processDecoratorStatus(this.updateOrderShippingAddress(order, this.request.payload), this.response);
        this.processDecoratorStatus(this.updateOrderBillingAddress(order, this.request.payload), this.response);

        Transaction.commit();
    } catch (e) {
        Transaction.rollback();
        throw e;
    }

    // invoke custom hook
    globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onAfterShippingUpdate, order, this.request.payload);

    // write notes
    this.writeNotes(order, 'GLOBALE_ORDER_SHIPPING_UPDATE');

    this.response.sfccOrderNumber = order.orderNo;
    this.response.success = true;
};

module.exports = OrderUpdateShippingInfoAction;
