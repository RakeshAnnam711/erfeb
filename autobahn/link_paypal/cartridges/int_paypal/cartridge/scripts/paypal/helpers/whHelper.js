'use strict';

const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');

const paypalConstants = require('*/cartridge/config/constants');
const prefs = require('*/cartridge/config/preferences');
const paypalHelper = require('*/cartridge/scripts/paypal/helpers/paypalHelper');
const paymentInstrumentHelper = require('*/cartridge/scripts/paypal/helpers/paymentInstrumentHelper');

/**
 * Updates payment status of order in the Business manager
 * @param {dw.order.Order} order Order instance
 * @param {string} paymentStatus Payment Status
 * @param {Object} responseData Response data to API call
 */
function updateOrderPaymentStatus(order, paymentStatus, responseData) {
    const requestData = {
        summary: Resource.msg('paypal.request.webhook.summary', 'locale', null)
    };

    responseData.paymentStatus = paymentStatus;

    Transaction.wrap(function() {
        const paymentInstrument = paymentInstrumentHelper.getPaypalPaymentInstrument(order);
        const paymentTransaction = paymentInstrument.paymentTransaction;

        // Updates order paypal payment status
        paymentInstrument.custom.paypalPaymentStatus = paymentStatus;
        paymentInstrument.custom.paypalRequest = JSON.stringify(requestData);
        paymentInstrument.custom.paypalResponse = JSON.stringify(responseData);

        paymentTransaction.custom.paypalTransactionHistory = paypalHelper.prepareTransactionHistory(paymentTransaction, responseData);
    });
}

/**
 * Updates payment on demandware sides
 * @param {string} eventType Event type
 * @param {Object} eventResource - Web Hook payload object.
 * @returns {void}
 */
function updatePaymentOnDwSide(eventType, eventResource) {
    const paypalApi = require('*/cartridge/scripts/paypal/api');

    const orderNo = eventResource.invoice_id;
    const paymentStatus = eventResource.status;

    if (!orderNo || !paymentStatus) {
        return;
    }

    // Gets order needed to update payment status
    const order = paypalHelper.getOrderByOrderNo(orderNo);

    if (!order) {
        return;
    }

    if (eventType === paypalConstants.PAYMENT_CAPTURE_REFUNDED) {
        const paymentInstrument = paymentInstrumentHelper.getPaypalPaymentInstrument(order);
        const orderData = paypalApi.getOrderDetails(paymentInstrument);
        const status = paypalHelper.getTransactionStatus(orderData);

        updateOrderPaymentStatus(order, status, eventResource);
    } else {
        updateOrderPaymentStatus(order, paymentStatus, eventResource);
    }
}

/**
 * Removes payment method from customer's wallet
 * @param {dw.customer.Profile} customerWallet Order instance
 * @param {string} paymentToken payment token of deleted payment method to compare
 */
function removePaymentMethod(customerWallet, paymentToken) {
    const customerSavedPaymentMethods = customerWallet.getPaymentInstruments().toArray();

    if (!customerSavedPaymentMethods) {
        return;
    }

    const paymentToDelete = customerSavedPaymentMethods.find(function(paymentInstrument) {
        return paymentInstrument.creditCardToken === paymentToken;
    });

    if (!paymentToDelete) {
        return;
    }

    const paymentMethod = paymentToDelete.paymentMethod;
    const isDefaultPaymentMethod = paymentToDelete.custom && paymentToDelete.custom.payPalDefaultCard;

    Transaction.wrap(function() {
        customerWallet.removePaymentInstrument(paymentToDelete);

        const updatedPaymentList = customerWallet.getPaymentInstruments(paymentMethod).toArray();

        if (isDefaultPaymentMethod && updatedPaymentList.length) {
            const newDefaultPaymentMethod = updatedPaymentList.pop();

            newDefaultPaymentMethod.custom.payPalDefaultCard = true;
        }
    });
}

/**
 * Removes payment on demandware's side
 * @param {Object} whResource - Web Hook payload object.
 */
function removePaymentMethodOnDwSide(whResource) {
    const customerHelper = require('*/cartridge/scripts/paypal/helpers/customerHelper');
    const SystemObjectMgr = require('dw/object/SystemObjectMgr');

    const paymentToken = whResource.id;
    const token = '*'.concat(paymentToken, '*');
    const query = 'custom.payPalSavedCardsPaymentTokens LIKE {0}';
    const customerProfile = SystemObjectMgr.querySystemObject('Profile', query, token);

    if (customerProfile) {
        removePaymentMethod(customerProfile.wallet, paymentToken);

        Transaction.wrap(function() {
            customerHelper.deletePayPalSavedCardsPaymentToken(customerProfile.custom, paymentToken);
        });
    }
}

/**
 * Updates history data
 * @param {string} history - stringified dispute history object
 * @param {Object} entry - set of details for dispute
 * @returns {string} - updated stringified dispute history object
 */
function updateDisputeHistory(history, entry) {
    const parsedHistory = JSON.parse(history);

    parsedHistory.push({
        status: entry.status,
        time: entry.update_time,
        amount: entry.dispute_amount.value
    });

    return JSON.stringify(parsedHistory);
}

/**
 * Updates dispute due to webhook event
 * @param {string} eventType - type of the event
 * @param {Object} entry - set of details for dispute
 */
function updateDispute(eventType, entry) {
    const CustomObjectMgr = require('dw/object/CustomObjectMgr');

    let dispute = CustomObjectMgr.getCustomObject('PayPalDisputes', entry.dispute_id);

    if ((eventType === paypalConstants.CUSTOMER_DISPUTE_CREATED) || (dispute === null)) {
        dispute = CustomObjectMgr.createCustomObject('PayPalDisputes', entry.dispute_id);
    }

    dispute.custom.create_time = entry.create_time;
    dispute.custom.update_time = entry.update_time;
    dispute.custom.reason = entry.reason;
    dispute.custom.status = entry.status;
    dispute.custom.currency_code = entry.dispute_amount.currency_code;
    dispute.custom.amount = entry.dispute_amount.value;
    dispute.custom.messages = JSON.stringify(entry.messages || []);

    if (dispute.custom.history) {
        dispute.custom.history = updateDisputeHistory(dispute.custom.history, entry);
    } else {
        dispute.custom.history = JSON.stringify([{
            status: entry.status,
            time: entry.update_time,
            amount: entry.dispute_amount.value
        }]);
    }
}

/**
 * Sets dispute id for Order system object
 * @param {Object} dispute - set of details for dispute
 */
function setDisputeIdForOrder(dispute) {
    const OrderMgr = require('dw/order/OrderMgr');
    const disputedTransactions = dispute.disputed_transactions;

    let order = null;

    disputedTransactions.forEach(function(transaction) {
        order = OrderMgr.getOrder(transaction.invoice_number);

        if (order) {
            order.custom.paypalDisputeId = dispute.dispute_id;
        }
    });
}

/**
 * Updates dispute due to webhook event and sets simplified or basic disputes page view.
 * @param {string} eventType - type of the event
 * @param {Object} entry - set of details for dispute
 */
function disputeFlow(eventType, entry) {
    Transaction.wrap(function() {
        if (!prefs.simplifiedDisputePage) {
            updateDispute(eventType, entry);
        }

        setDisputeIdForOrder(entry);
    });
}

/**
 * Checks if endpoint received a valid event
 * @param {string} eventType Event type
 * @returns {boolean} True if event type is appropriate to endpoint
 */
function isAppropriateEventType(eventType) {
    const eventTypes = [
        paypalConstants.PAYMENT_CAPTURE_REFUNDED,
        paypalConstants.PAYMENT_CAPTURE_COMPLETED,
        paypalConstants.PAYMENT_AUTHORIZATION_VOIDED,
        paypalConstants.CUSTOMER_DISPUTE_CREATED,
        paypalConstants.CUSTOMER_DISPUTE_UPDATED,
        paypalConstants.CUSTOMER_DISPUTE_RESOLVED,
        paypalConstants.VAULT_PAYMENT_TOKEN_DELETED
    ];

    return eventTypes.some(function(type) {
        return type === eventType;
    });
}

module.exports = {
    updateOrderPaymentStatus: updateOrderPaymentStatus,
    updatePaymentOnDwSide: updatePaymentOnDwSide,
    removePaymentMethodOnDwSide: removePaymentMethodOnDwSide,
    disputeFlow: disputeFlow,
    isAppropriateEventType: isAppropriateEventType
};
