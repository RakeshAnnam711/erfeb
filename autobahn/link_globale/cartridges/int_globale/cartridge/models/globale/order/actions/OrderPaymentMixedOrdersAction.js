'use strict';

var AbstractAction = require('*/cartridge/models/globale/generic/AbstractAction');

/**
 * Represents OrderPaymentMixedOrdersAction
 * @constructor
 * @param {Object} requestObj - request object
 * @param {Object} responseObj - response object
 */
function OrderPaymentMixedOrdersAction(requestObj, responseObj) {
    AbstractAction.call(this, requestObj, responseObj);
}

/* Inherits AbstractAction */
OrderPaymentMixedOrdersAction.prototype = Object.create(AbstractAction.prototype);

/**
 * Process order
 * @param {Object} payload - Payload
 * @param {boolean} isSubOrder - The flag which identify that is processed sub order
 * @throws {Error}
 */
OrderPaymentMixedOrdersAction.prototype.processOrder = function (payload, isSubOrder) {
    var Transaction = require('dw/system/Transaction');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
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
                PaymentDetails: { required: true },
                InternationalDetails: { required: true },
                PrimaryBilling: { required: true }
            }, payload);
            if (!this.request.validation.valid) {
                throw new Error('Invalid payload: ' + JSON.stringify(this.request.validation));
            }
        }

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
            if (order.custom[globaleHelpers.customAttr.order.geOrderNumber] !== payload.OrderId) {
                responseData.errorCode = 301;
                responseData.errorMessage = 'SFCC GE order number does not match provided value: ' +
                    order.custom[globaleHelpers.customAttr.order.geOrderNumber] + '->' +
                    payload.OrderId;
                throw new Error(responseData.errorMessage);
            }

            // place order (if required)
            this.processDecoratorStatus(this.placeOrder(order), responseData);

            // confirm order (if required)
            this.processDecoratorStatus(this.confirmOrder(order), responseData);

            // update order shipping address attributes
            this.processDecoratorStatus(this.setGeShippingAddressAttributes(order, payload), responseData);
            this.processDecoratorStatus(this.setCustomerShippingAddressAttributes(order, payload), responseData);

            // update order customer address
            this.processDecoratorStatus(this.updateOrderShippingAddress(order, payload), responseData);
            this.processDecoratorStatus(this.updateOrderBillingAddress(order, payload), responseData);

            // update payment attributes
            this.processDecoratorStatus(this.setPaymentAttributes(order, payload), responseData);

            // update payment instruments
            this.processDecoratorStatus(this.setPaymentInstruments(order, payload), responseData);

            // update payment status
            this.processDecoratorStatus(this.setPaymentStatus(order), responseData);

            // update export status
            this.processDecoratorStatus(this.setExportStatus(order), responseData);

            if (globaleHelpers.isNativeGiftCertificateEnabled()) {
                // create Gift Certificate
                this.processDecoratorStatus(this.createGiftCertificate(order), responseData);
            }

            Transaction.commit();
        } catch (e) {
            Transaction.rollback();
            throw e;
        }

        // invoke custom hook
        globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onAfterPaymentUpdate, order, payload);

        // write notes
        this.writeNotes(order, 'GLOBALE_ORDER_PAYMENT');

        // response
        responseData.geOrderNumber = order.custom[globaleHelpers.customAttr.order.geOrderNumber];
        responseData.sfccOrderNumber = order.orderNo;
        if (!isSubOrder) {
            responseData.mainSuccess = true;
        } else {
            responseData.success = true;
        }
    } catch (e) {
        logger.error('GLOBALE_ORDER_PAYMENT_UPDATE: {0}', logger.message(e));
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
        logger.error('GLOBALE_ORDER_PAYMENT_UPDATE: {0}', logger.message(e));
    }
};

/**
 * Update order
 * @throws {Error}
 */
OrderPaymentMixedOrdersAction.prototype.run = function () {
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
    globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.onAfterPaymentUpdateMixedOrders, new ArrayList(this.response.data.orders), this.request.payload);
};

module.exports = OrderPaymentMixedOrdersAction;
