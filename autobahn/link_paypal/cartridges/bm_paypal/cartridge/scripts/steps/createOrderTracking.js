'use strict';

/**
 * Job Step Type that applies Tracking API for the order
 *
 * @module bm_paypal/cartridge/scripts/steps/createOrderTracking.js
 *
 * @parameters {Email} - the email which can be used for sending alerts
 * @parameters {DaysToRetrieve} - the period which can be used for retrieving the respective transactions (number of days)
 * @parameters {StatusesToCheck} - the statuses that will be considered to be checked, namely: 'DENIED, DECLINED, FAILED'
 * @parameters {AlertsInBM} - activates alerts for failed transactions in Business Manager
 */

/**
 * Filters orders by date (N days before) and by PayPal status 'COMPLETED'
 * @param {number} dayCount - amount of days
 * @returns {Array} array of filtered orders
 */
function getOrders(dayCount) {
    const OrderMgr = require('dw/order/OrderMgr');

    const queryString = 'creationDate >= {0}';
    const date = new Date();

    date.setDate(date.getDate() - dayCount);

    const orders = OrderMgr.searchOrders(queryString, null, date);

    return orders.asList().toArray().filter(function(order) {
        const paymentInstrument = order.paymentInstrument;

        if (!paymentInstrument) {
            return false;
        }

        return paymentInstrument.custom.paypalPaymentStatus === 'COMPLETED';
    });
}

/**
 * Applies Tracking API for the COMPLETED order
 * @param {dw.util.HashMap} parameters that are available as scriptable objects for each exposed module function and for the dw.job.JobStepExecution object.
 @returns {dw.system.Status} - result of the operation
 */
function createOrderTracking(parameters) {
    const Status = require('dw/system/Status');
    const paypalApi = require('~/cartridge/scripts/paypal/api/paypal');

    const dayCount = parameters.Days;
    const orders = getOrders(dayCount);

    orders.forEach(function(order) {
        const shipment = order.shipments[0];
        const trackingNumber = shipment.trackingNumber;

        if (trackingNumber) {
            paypalApi.addTrackingAPI(order);
        }
    });

    return new Status(Status.OK);
}

module.exports = {
    createOrderTracking: createOrderTracking
};
