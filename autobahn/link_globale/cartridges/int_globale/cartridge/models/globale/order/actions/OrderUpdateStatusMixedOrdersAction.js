'use strict';

var AbstractAction = require('*/cartridge/models/globale/generic/AbstractAction');

/**
 * Represents OrderUpdateStatusMixedOrdersAction
 * @constructor
 * @param {Object} requestObj - request object
 * @param {Object} responseObj - response object
 */
function OrderUpdateStatusMixedOrdersAction(requestObj, responseObj) {
    AbstractAction.call(this, requestObj, responseObj);
    this.order = null;
}

/* Inherits AbstractAction */
OrderUpdateStatusMixedOrdersAction.prototype = Object.create(AbstractAction.prototype);

/**
 * Process order
 * @param {Object} payload - Payload
 * @param {boolean} isSubOrder - The flag which identify that is processed sub order
 * @throws {Error}
 */
OrderUpdateStatusMixedOrdersAction.prototype.processOrder = function (payload, isSubOrder) {
    var Transaction = require('dw/system/Transaction');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var systemUtils = require('*/cartridge/scripts/util/globale/system');
    var logger = globaleHelpers.getLogger();
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    var order = null;
    var responseData = {
        errorCode: null,
        errorMessage: null
    };

    try {
        if (isSubOrder) {
            // validate payload
            this.request.validate({
                MerchantOrderId: { required: true },
                OrderId: { required: true },
                StatusCode: { required: true }
            }, payload);
            if (!this.request.validation.valid) {
                throw new Error('Invalid payload: ' + JSON.stringify(this.request.validation));
            }
        }

        // wait for 2 secs to avoid ORMOptimisticLockingException (refund and cancellation notifications are sent simultaniously)
        systemUtils.sleep(2000);

        // find SFCC order
        order = this.findOrder(payload.MerchantOrderId);
        if (!order) {
            responseData.errorCode = 301;
            responseData.errorMessage = 'The order does not exist';
            throw new Error(responseData.errorMessage);
        }

        Transaction.begin();
        try {
            // check GE order number
            if (
                order.custom[globaleHelpers.customAttr.order.geOrderNumber] &&
                order.custom[globaleHelpers.customAttr.order.geOrderNumber] !== payload.OrderId
            ) {
                responseData.errorCode = 301;
                responseData.errorMessage = 'SFCC GE order number does not match provided value: ' +
                    order.custom[globaleHelpers.customAttr.order.geOrderNumber] + '->' +
                    payload.OrderId;
                throw new Error(responseData.errorMessage);
            }

            // update order status
            this.processDecoratorStatus(this.updateOrderStatus(order, payload), responseData);

            Transaction.commit();
        } catch (e) {
            Transaction.rollback();
            throw e;
        }

        // invoke custom hook
        globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onAfterStatusUpdate, order, payload);

        // write notes
        this.writeNotes(order, 'GLOBALE_ORDER_STATUS_UPDATE');

        // response
        responseData.geOrderNumber = order.custom[globaleHelpers.customAttr.order.geOrderNumber];
        responseData.sfccOrderNumber = order.orderNo;
        if (!isSubOrder) {
            responseData.mainSuccess = true;
        } else {
            responseData.success = true;
        }
    } catch (e) {
        logger.error('GLOBALE_ORDER_STATUS_UPDATE: {0}', logger.message(e));
        responseData.errorCode = responseData.errorCode || 100;
        responseData.errorMessage = responseData.errorMessage || (e.message + '; ' + e.stack);
    }

    // set response
    try {
        if (!isSubOrder) {
            this.response.setMainOrderData(order, responseData);
        } else {
            this.response.setSubOrderData(order, responseData);
        }
    } catch (e) {
        logger.error('GLOBALE_ORDER_SOTM_UPDATE: {0}', logger.message(e));
    }
};

/**
 * Updates order status
 * @throws {Error}
 */
OrderUpdateStatusMixedOrdersAction.prototype.run = function () {
    var ArrayList = require('dw/util/ArrayList');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    // process major order
    this.processOrder(this.request.payload);

    // process sub orders
    this.request.payload.Subs.forEach(function (orderPayload) {
        // process sub order
        this.processOrder(orderPayload, true);
    }.bind(this));

    // invoke custom hook
    globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onAfterStatusUpdateMixedOrders, new ArrayList(this.response.data.orders), this.request.payload);
};

module.exports = OrderUpdateStatusMixedOrdersAction;
