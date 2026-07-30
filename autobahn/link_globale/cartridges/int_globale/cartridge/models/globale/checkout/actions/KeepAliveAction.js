'use strict';

var AbstractAction = require('*/cartridge/models/globale/generic/AbstractAction');

/**
 * Represents KeepAliveAction
 * @constructor
 * @param {Object} requestObj - request object
 * @param {Object} responseObj - response object
 */
function KeepAliveAction(requestObj, responseObj) {
    AbstractAction.call(this, requestObj, responseObj);
}

/* Inherits AbstractAction */
KeepAliveAction.prototype = Object.create(AbstractAction.prototype);

/**
 * Handles KeepAlive
 * @throws {Error}
 */
KeepAliveAction.prototype.run = function () {
    var BasketMgr = require('dw/order/BasketMgr');

    var basket = BasketMgr.getCurrentBasket();

    // reserve inventory if required
    if (basket) {
        this.processDecoratorStatus(this.reserveInventory(basket, this.request.payload), this.response);
    }

    this.response.success = true;
};

module.exports = KeepAliveAction;
