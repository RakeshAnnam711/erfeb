'use strict';

var AbstractAction = require('*/cartridge/models/globale/generic/AbstractAction');

/**
 * Represents OrderClientCreateMixedOrdersAction
 * @constructor
 * @param {Object} requestObj - request object
 * @param {Object} responseObj - response object
 */
function OrderClientCreateMixedOrdersAction(requestObj, responseObj) {
    AbstractAction.call(this, requestObj, responseObj);
    this.basket = null;
}

/* Inherits AbstractAction */
OrderClientCreateMixedOrdersAction.prototype = Object.create(AbstractAction.prototype);

/**
 * Creates order from customer basket
 * @throws {Error}
 */
OrderClientCreateMixedOrdersAction.prototype.run = function () {
    var BasketMgr = require('dw/order/BasketMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');
    var geBsketMgr = require('*/cartridge/scripts/factories/globale/dw/basket');

    // get basket
    this.basket = BasketMgr.getCurrentBasket();

    // clear basket
    var isBasketExist = !geBsketMgr.geClearCart(this.basket);

    // invoke onCreateOrder hook
    globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onAfterCreateMixedOrder, isBasketExist, this.request.payload);

    // set response
    this.response.errorMessage = 'Skipped Order Create. Used Mixed Orders Flow';
};

module.exports = OrderClientCreateMixedOrdersAction;
