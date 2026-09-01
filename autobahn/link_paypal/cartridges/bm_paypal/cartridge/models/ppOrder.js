'use strict';

const paymentInstrumentHelper = require('~/cartridge/scripts/paypal/paymentInstrumentHelpers');

/**
 * PP Order Model
 */
function OrderModel() { }

/**
 * Gets transaction ID from order payment instrument's custom property
 * @param {dw.order.Order} order current order
 * @returns {string} transaction id
 */
OrderModel.prototype.getTransactionIdFromOrder = function(order) {
    const paymentInstrument = paymentInstrumentHelper.getPaypalPaymentInstrument(order);

    return paymentInstrument.getCustom().paypalToken || paymentInstrument.getCustom().paypalOrderID;
};

module.exports = OrderModel;
