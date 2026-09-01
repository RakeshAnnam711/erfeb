'use strict';

const OrderMgr = require('dw/order/OrderMgr');

const utils = require('*/cartridge/scripts/paypal/utils');
const processor = require('*/cartridge/scripts/paypal/processor');

/**
 * ProcessForm point for setting data
 * @param {Object} req current request
 * @param {Object} paymentForm payment form from hook
 * @param {Object} viewData data from hook
 * @returns {Object} viewData with required data
 */
function processForm(req, paymentForm, viewData) {
    const paypalConstants = require('*/cartridge/config/constants');

    paymentForm.paymentMethod = {
        value: paypalConstants.PAYMENT_METHOD_ID_PAYPAL,
        htmlName: paypalConstants.PAYMENT_METHOD_ID_PAYPAL
    };
    viewData.paymentMethod = {
        value: paypalConstants.PAYMENT_METHOD_ID_PAYPAL,
        htmlName: paypalConstants.PAYMENT_METHOD_ID_PAYPAL
    };
    viewData.paymentInformation = {
        billingForm: paymentForm
    };

    return {
        viewData: viewData
    };
}

/**
 * Handle entry point
 * @param {Object} basket Basket
 * @param {Object} billingForm - paymentForm from hook
 * @returns {Object} processor result
 */
function Handle(basket, billingForm) {
    return processor.handle(basket, billingForm);
}

/**
 * Authorize entry point
 * @param {Object} orderNumber order number
 * @param {Object} paymentInstrument payment instrument
 * @returns {Object} processor result
 */
function Authorize(orderNumber, paymentInstrument) {
    const order = OrderMgr.getOrder(orderNumber);

    return processor.authorize(order, paymentInstrument);
}

/**
 * createOrderNo entry point for setting or creating order number
 * @returns {string} order number
 */
function createOrderNo() {
    let isOrderExist;
    let orderNo = session.privacy.paypalUsedOrderNo;

    if (!orderNo) {
        orderNo = OrderMgr.createOrderSequenceNo();
        session.privacy.paypalUsedOrderNo = orderNo;
    } else {
        try {
            isOrderExist = !empty(OrderMgr.getOrder(orderNo));

            if (isOrderExist) {
                orderNo = OrderMgr.createOrderSequenceNo();
                session.privacy.paypalUsedOrderNo = orderNo;
            }
        } catch (error) {
            utils.createErrorLog(error);
            orderNo = OrderMgr.createOrderSequenceNo();
            session.privacy.paypalUsedOrderNo = orderNo;
        }
    }

    return orderNo;
}

exports.processForm = processForm;
exports.Handle = Handle;
exports.Authorize = Authorize;
exports.createOrderNo = createOrderNo;
