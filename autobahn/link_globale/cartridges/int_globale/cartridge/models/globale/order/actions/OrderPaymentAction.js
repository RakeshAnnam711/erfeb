'use strict';

var AbstractAction = require('*/cartridge/models/globale/generic/AbstractAction');

/**
 * Represents OrderPaymentAction
 * @constructor
 * @param {Object} requestObj - request object
 * @param {Object} responseObj - response object
 */
function OrderPaymentAction(requestObj, responseObj) {
    AbstractAction.call(this, requestObj, responseObj);
}

/* Inherits AbstractAction */
OrderPaymentAction.prototype = Object.create(AbstractAction.prototype);

/**
 * Creates order from customer basket
 * @throws {Error}
 */
OrderPaymentAction.prototype.run = function () {
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

        // place order (if required)
        this.processDecoratorStatus(this.placeOrder(order), this.response);

        // confirm order (if required)
        this.processDecoratorStatus(this.confirmOrder(order), this.response);

        // update order shipping address attributes
        this.processDecoratorStatus(this.setGeShippingAddressAttributes(order, this.request.payload), this.response);
        this.processDecoratorStatus(this.setCustomerShippingAddressAttributes(order, this.request.payload), this.response);

        // update order customer address
        this.processDecoratorStatus(this.updateOrderShippingAddress(order, this.request.payload), this.response);
        this.processDecoratorStatus(this.updateOrderBillingAddress(order, this.request.payload), this.response);

        // update payment attributes
        this.processDecoratorStatus(this.setPaymentAttributes(order, this.request.payload), this.response);

        // update payment instruments
        this.processDecoratorStatus(this.setPaymentInstruments(order, this.request.payload), this.response);

        // update payment status
        this.processDecoratorStatus(this.setPaymentStatus(order), this.response);

        // update export status
        this.processDecoratorStatus(this.setExportStatus(order), this.response);

        if (globaleHelpers.isNativeGiftCertificateEnabled()) {
            // create Gift Certificate
            this.processDecoratorStatus(this.createGiftCertificate(order), this.response);
        }

        Transaction.commit();
    } catch (e) {
        Transaction.rollback();
        throw e;
    }

    // invoke custom hook
    globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onAfterPaymentUpdate, order, this.request.payload);

    // write notes
    this.writeNotes(order, 'GLOBALE_ORDER_PAYMENT');

    this.response.data.orders.push(order);
    this.response.sfccOrderNumber = order.orderNo;
    this.response.success = true;
};

module.exports = OrderPaymentAction;
