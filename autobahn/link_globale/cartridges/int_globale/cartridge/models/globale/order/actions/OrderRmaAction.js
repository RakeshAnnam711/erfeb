'use strict';

var AbstractAction = require('*/cartridge/models/globale/generic/AbstractAction');

/**
 * Represents OrderRmaAction
 * @constructor
 * @param {Object} requestObj - request object
 * @param {Object} responseObj - response object
 */
function OrderRmaAction(requestObj, responseObj) {
    AbstractAction.call(this, requestObj, responseObj);
}

/* Inherits AbstractAction */
OrderRmaAction.prototype = Object.create(AbstractAction.prototype);

/**
 * Update Order RMA
 * @throws {Error}
 */
OrderRmaAction.prototype.run = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    // find SFCC order
    var order = this.findOrder(this.request.payload.MerchantOrderId);
    if (!order) {
        this.response.errorCode = 301;
        this.response.errorMessage = 'The order does not exist';
        throw new Error(this.response.errorMessage);
    }

    // check GE order number
    if (order.custom[globaleHelpers.customAttr.order.geOrderNumber] !== this.request.payload.OrderId) {
        this.response.errorCode = 301;
        this.response.errorMessage = 'SFCC GE order number does not match provided value: ' +
            order.custom[globaleHelpers.customAttr.order.geOrderNumber] + '->' +
            this.request.payload.OrderId;
        throw new Error(this.response.errorMessage);
    }

    // create GE to SFCC RMA notification
    var notificationCo = this.createRMA(this.request.payload);

    // add order note
    this.addNote('Notification was created: CO ID: ' + notificationCo.custom.ID);

    // invoke onGlobaleOrderRmaUpdate hook
    globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onAfterGeRmaUpdate, order, this.request.payload);

    // write notes
    this.writeNotes(order, 'GE_to_SFCC_CreateOrderRMA');

    this.response.sfccOrderNumber = order.orderNo;
    this.response.success = true;
};

module.exports = OrderRmaAction;
