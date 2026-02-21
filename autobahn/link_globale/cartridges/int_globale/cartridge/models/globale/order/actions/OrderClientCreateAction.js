/* globals session */

'use strict';

var AbstractAction = require('*/cartridge/models/globale/generic/AbstractAction');

/**
 * Represents OrderClientCreateAction
 * @constructor
 * @param {Object} requestObj - request object
 * @param {Object} responseObj - response object
 */
function OrderClientCreateAction(requestObj, responseObj) {
    AbstractAction.call(this, requestObj, responseObj);
    this.basket = null;
    this.order = null;
}

/* Inherits AbstractAction */
OrderClientCreateAction.prototype = Object.create(AbstractAction.prototype);

/**
 * Creates order from customer basket
 * @throws {Error}
 */
OrderClientCreateAction.prototype.run = function () {
    var OrderMgr = require('dw/order/OrderMgr');
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geBsketMgr = require('*/cartridge/scripts/factories/globale/dw/basket');

    try {
        var existingOrder = OrderMgr.getOrder(this.request.payload.MerchantOrderId);

        if (existingOrder && existingOrder.custom[globaleHelpers.customAttr.order.geIsOrderCreatedPayByLinkScenario]) {
            this.response.sfccOrderNumber = existingOrder.orderNo;
            this.response.sfccOrderToken = existingOrder.orderToken;
            return;
        }

        // get basket
        this.basket = BasketMgr.getCurrentBasket();

        Transaction.begin();
        try {
            this.processDecoratorStatus(this.createOrder(this.request.payload.currency, true), this.response);
            Transaction.commit();
        } catch (e) {
            Transaction.rollback();
            throw e;
        }
        this.writeNotes(this.order, 'GLOBALE_ORDER_CREATE');

        this.response.sfccOrderNumber = this.order.orderNo;
        this.response.sfccOrderToken = this.order.orderToken;
    } catch (e) {
        // clear basket
        geBsketMgr.geClearCart(this.basket);

        // restore default session currency
        session.setCurrency(require('dw/util/Currency').getCurrency(globaleHelpers.getMerchantBaseCurrencyCode()));

        throw e;
    }
};

module.exports = OrderClientCreateAction;
