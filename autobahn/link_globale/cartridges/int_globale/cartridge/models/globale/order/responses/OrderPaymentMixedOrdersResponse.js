'use strict';

var AbstractResponse = require('*/cartridge/models/globale/generic/AbstractResponse');

/**
 * Represents OrderPaymentMixedOrdersResponse
 * @constructor
 */
function OrderPaymentMixedOrdersResponse() {
    AbstractResponse.call(this);

    this.data.orders = [];

    this.sfccOrderNumber = null;
    this.geOrderNumber = null;
    this.success = false;
    this.mainSuccess = false;
    this.errorCode = null;
    this.errorMessage = null;
    this.errorDescription = null;
    this.subOrders = [];
}

/* Inherits AbstractAction */
OrderPaymentMixedOrdersResponse.prototype = Object.create(AbstractResponse.prototype);

/**
 * Set main order data
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} orderData - response order data
 * @returns {void}
 */
OrderPaymentMixedOrdersResponse.prototype.setMainOrderData = function (order, orderData) {
    if (order) {
        this.data.orders.push(order);
    }

    this.sfccOrderNumber = orderData.sfccOrderNumber || null;
    this.success = orderData.mainSuccess || false;
    this.mainSuccess = orderData.mainSuccess || false;
    this.errorCode = orderData.errorCode || null;
    this.errorMessage = orderData.errorMessage || null;
    this.errorDescription = orderData.errorDescription || null;
    this.geOrderNumber = orderData.geOrderNumber || null;
};

/**
 * Set sub order data
 * @param {dw.order.Order} order - SFCC order
 * @param {Object} orderData - response order data
 * @returns {void}
 */
OrderPaymentMixedOrdersResponse.prototype.setSubOrderData = function (order, orderData) {
    if (order) {
        this.data.orders.push(order);
    }

    this.subOrders.push({
        geOrderNumber: orderData.geOrderNumber || null,
        sfccOrderNumber: orderData.sfccOrderNumber || null,
        success: orderData.success || false,
        errorCode: orderData.errorCode || null,
        errorMessage: orderData.errorMessage || null,
        errorDescription: orderData.errorDescription || null
    });
};

/**
 * Returns response payload
 * @returns {Object} - response payload
 */
OrderPaymentMixedOrdersResponse.prototype.getPayload = function () {
    // response object
    var responseObj = {
        InternalOrderId: this.sfccOrderNumber,
        OrderId: this.sfccOrderNumber,
        Success: this.success,
        MainOrderSuccess: this.mainSuccess,
        ErrorCode: this.errorCode,
        Message: this.errorMessage,
        Description: this.errorDescription,
        SubOrders: []
    };

    // update 'SubOrders' in response object
    this.subOrders.forEach(function (subOrder) {
        responseObj.SubOrders.push({
            GEOrderId: subOrder.geOrderNumber,
            InternalOrderId: subOrder.sfccOrderNumber,
            OrderId: subOrder.sfccOrderNumber,
            Success: subOrder.success,
            ErrorCode: subOrder.errorCode,
            Message: subOrder.errorMessage,
            Description: subOrder.errorDescription
        });

        if (subOrder.success === false) {
            responseObj.Success = subOrder.success;
        }
    });

    return responseObj;
};

module.exports = OrderPaymentMixedOrdersResponse;
