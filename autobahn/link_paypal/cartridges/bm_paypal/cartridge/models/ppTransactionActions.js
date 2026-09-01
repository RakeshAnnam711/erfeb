'use strict';

const PPOrderMgrModel = require('*/cartridge/models/ppOrderMgr');
const PPRestApiWrapper = require('~/cartridge/scripts/paypal/api/restApiWrapper');
const ppOrderMgrModel = new PPOrderMgrModel();
const ppRestApiWrapper = new PPRestApiWrapper();

/**
 * PP Transaction Actions model
 */
function ppTransactionActions() { }

/**
* Makes void transaction api call and updates corresponding order data
* @param {Object} reqData request data object
* @return {Object} response
*/
ppTransactionActions.prototype.voidAction = function(reqData) {
    const callApiResponse = ppRestApiWrapper.doVoid(reqData);

    if (callApiResponse.err) {
        return callApiResponse;
    }

    const orderTransactionResult = ppOrderMgrModel.updateOrderData(reqData.orderNo, reqData.orderToken);

    if (!orderTransactionResult) {
        return { err: true };
    }

    return callApiResponse;
};

/**
* Makes reauthorize transaction api call and updates corresponding order data
* @param {Object} reqData request data object
* @return {Object} response
*/
ppTransactionActions.prototype.reauthorizeAction = function(reqData) {
    const callApiResponse = ppRestApiWrapper.doReauthorize(reqData);

    if (callApiResponse.err) {
        return callApiResponse;
    }

    const orderTransactionResult = ppOrderMgrModel.updateOrderData(reqData.orderNo, reqData.orderToken);

    if (!orderTransactionResult) {
        return { err: true };
    }

    return callApiResponse;
};

/**
* Makes refund transaction api call and updates corresponding order data
* @param {Object} reqData request data object
* @return {Object} response
*/
ppTransactionActions.prototype.refundTransactionAction = function(reqData) {
    const callApiResponse = ppRestApiWrapper.doRefundTransaction(reqData);

    if (callApiResponse.err) {
        return callApiResponse;
    }

    const orderTransactionResult = ppOrderMgrModel.updateOrderData(reqData.orderNo, reqData.orderToken);

    if (!orderTransactionResult) {
        return { err: true };
    }

    return callApiResponse;
};

/**
* Makes capture transaction api call and updates corresponding order data
* @param {Object} reqData request data object
* @return {Object} response
*/
ppTransactionActions.prototype.captureAction = function(reqData) {
    const OrderMgr = require('dw/order/OrderMgr');
    const Resource = require('dw/web/Resource');
    const Money = require('dw/value/Money');

    const order = OrderMgr.getOrder(reqData.orderNo, reqData.orderToken);
    const currencyCode = order.currencyCode;
    const previouslyCapturedAmount = (reqData.capturedAmount > 0)
        ? new Money(reqData.capturedAmount, currencyCode)
        : new Money(0, currencyCode);
    const currentAmount = new Money(reqData.amt, currencyCode);
    const capturedAmount = currentAmount.add(previouslyCapturedAmount);
    const isCaptureMoreThanAuthorized = capturedAmount.compareTo(order.totalGrossPrice) > 0;

    const paymentSource = JSON.parse(reqData.paymentSource);

    if (isCaptureMoreThanAuthorized && !paymentSource.paypal) {
        return {
            err: true,
            responseData: {
                l_longmessage0: Resource.msg('capture.amount.is.greater.than.authorized', 'paypalbm', null)
            }
        };
    }

    const callApiResponse = ppRestApiWrapper.doCapture(reqData);

    if (callApiResponse.err) {
        return callApiResponse;
    }

    const orderTransactionResult = ppOrderMgrModel.updateOrderData(reqData.orderNo, reqData.orderToken);

    if (isCaptureMoreThanAuthorized) {
        ppOrderMgrModel.addOrderNotes(order, capturedAmount);
    }

    if (!orderTransactionResult) {
        return { err: true };
    }

    return callApiResponse;
};

module.exports = ppTransactionActions;
