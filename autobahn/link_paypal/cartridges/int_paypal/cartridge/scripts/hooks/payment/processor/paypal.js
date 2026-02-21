'use strict';

/* global dw */

/**
 * ProcessForm point for setting data
 * @param {Object} req current request
 * @param {Object} paymentForm payment form from hook
 * @param {Object} viewData data from hook
 * @returns {Object} viewData with required data
 */
function processForm(req, paymentForm, viewData) {
    var result = {
        error: false,
        viewData: viewData
    };
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var formFieldErrors = {};
    var billingFormErrors = COHelpers.validateBillingForm(paymentForm.addressFields);
    if (Object.keys(billingFormErrors).length) {
        Object.keys(billingFormErrors).forEach(function (key) {
            formFieldErrors[key] = billingFormErrors[key];
        });
    }
    if (Object.keys(formFieldErrors).length) {
        result.error = true;
        result.fieldErrors = formFieldErrors;
    }

    return result;
}

/**
 * Handle entry point
 * @param {Object} basket Basket
 * @param {Object} billingForm - paymentForm from hook
 * @returns {Object} processor result
 */
function Handle(basket, billingForm) {
    var result = require('~/cartridge/scripts/paypal/processor').handle(basket, billingForm);
    return result;
}

/**
 * Authorize entry point
 * @param {Object} orderNumber order numebr
 * @param {Object} paymentInstrument payment intrument
 * @returns {Object} processor result
 */
function Authorize(orderNumber, paymentInstrument) {
    var order = require('dw/order/OrderMgr').getOrder(orderNumber);
    var result = require('~/cartridge/scripts/paypal/processor').authorize(order, paymentInstrument);
    return result;
}

/**
 * createOrderNo entry point for setting or creating order number
 * @returns {string} order number
 */
function createOrderNo() {
    let orderNo = session.privacy.paypalUsedOrderNo;
    let isOrderExist;
    const OrderMgr = require('dw/order/OrderMgr');
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
            require('../../../paypal/paypalUtils').createErrorLog(error);
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
