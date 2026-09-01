'use strict';

const PaymentMgr = require('dw/order/PaymentMgr');

const ppConstants = require('~/cartridge/config/constants');

/**
 * Retrieves the list of available in plugin payment methods
 * @returns {dw.order.PaymentMethod[]} An array of PaymentMethod objects found in the system
 */
function getPluginPaymentMethods() {
    return Array.from(
        ppConstants.PAYMENT_METHODS_MAP.keys()
    ).reduce(function(result, methodID) {
        const paymentMethod = PaymentMgr.getPaymentMethod(methodID);

        if (paymentMethod) {
            result.push(paymentMethod);
        }

        return result;
    }, []);
}

/**
 * Returns all payment methods id's array related to the PAYPAL processor
 * @returns {array} An array of payment methods ids
 */
function getPaymentMethodsIdWithPaypalProcessor() {
    const pluginPaymentMethods = getPluginPaymentMethods();

    return Array.filter(pluginPaymentMethods, function(paymentMethod) {
        return ppConstants.ALLOWED_PROCESSORS_IDS.includes(
            paymentMethod.paymentProcessor && paymentMethod.paymentProcessor.ID
        );
    }).map(function(paymentMethod) {
        return paymentMethod.ID;
    });
}

/**
 * Returns PayPal order payment instrument
 * @param {dw.order.Order} order - The order object
 * @returns {dw.order.OrderPaymentInstrument|null} payment instrument with id PAYPAL
 */
function getPaypalPaymentInstrument(order) {
    const availablePaymentMethods = getPaymentMethodsIdWithPaypalProcessor();

    let paymentInstrument = null;

    availablePaymentMethods.forEach(function(pmId) {
        const pi = order.getPaymentInstruments(pmId);

        if (!empty(pi)) {
            paymentInstrument = pi[0];
        }
    });

    return paymentInstrument;
}

/**
 * It updates the payment instrument of the order with the payment status of the transaction.
 * @param {dw.web.HttpParameterMap} httpParameterMap - The object that contains the parameters that are passed to the script.
 */
function updatePaypalPaymentInstrument(httpParameterMap) {
    const Transaction = require('dw/system/Transaction');

    const PPOrderMgrModel = require('*/cartridge/models/ppOrderMgr');
    const PPTransactionMgrModel = require('*/cartridge/models/ppTransactionMgr');
    const PPTransactionModel = require('*/cartridge/models/ppTransaction');

    const ppOrderMgrModel = new PPOrderMgrModel();
    const ppTransactionMgrModel = new PPTransactionMgrModel();

    const orderData = ppOrderMgrModel.getOrderData(httpParameterMap.orderNo.stringValue, httpParameterMap.orderToken.stringValue);
    const transaction = ppTransactionMgrModel.getTransactionData(httpParameterMap, orderData.transactionIdFromOrder);
    const ppTransactionModel = new PPTransactionModel(transaction, orderData.order);
    const paymentInstrument = getPaypalPaymentInstrument(orderData.order);

    Transaction.wrap(function() {
        paymentInstrument.custom.paypalPaymentStatus = ppTransactionModel.paymentstatus;
    });
}

/**
 * Returns payment method with ID value
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument payment instrument
 * @returns {dw.order.PaymentMethod|Object} payment method
 */
function getPaymentMethod(paymentInstrument) {
    const isCustomPaymentMethodName = paymentInstrument.custom.paymentId !== paymentInstrument.paymentMethod;

    const paymentMethodId = isCustomPaymentMethodName ? paymentInstrument.custom.paymentId : paymentInstrument.paymentMethod;

    return PaymentMgr.getPaymentMethod(paymentMethodId) || { ID: paymentMethodId };
}

/**
 * Returns payment method id
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument payment instrument
 * @returns {string} payment method id
 */
function getPaymentMethodId(paymentInstrument) {
    const paymentMethod = getPaymentMethod(paymentInstrument);

    return paymentMethod ? paymentMethod.ID : '';
}

module.exports = {
    getPaypalPaymentInstrument: getPaypalPaymentInstrument,
    updatePaypalPaymentInstrument: updatePaypalPaymentInstrument,
    getPaymentMethodsIdWithPaypalProcessor: getPaymentMethodsIdWithPaypalProcessor,
    getPaymentMethodId: getPaymentMethodId
};
