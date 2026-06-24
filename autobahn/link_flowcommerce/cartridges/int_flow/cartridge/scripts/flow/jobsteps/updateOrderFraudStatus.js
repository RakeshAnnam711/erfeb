'use strict';

/**
 * Sets the Fraud Status on a SFCC Order
 * @param {dw.order.Order} order - SFCC Order
 * @param {string} status - Fraud Status
 */
function setFraudStatus(order, status) {
    var Transaction = require('dw/system/Transaction');

    Transaction.wrap(function () {
        order.custom.flowFraudStatus = status; // eslint-disable-line no-param-reassign
    });
}

/**
 * Updates SFCC Orders with the Flow Order Status
 * @param {Object} options - Job options
 * @returns {dw.system.Status} Status Code
 */
function updateOrderFraudStatus(options) {
    var Status = require('dw/system/Status');
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var JobHelper = require('*/cartridge/scripts/flow/helpers/jobHelper');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');
    var fraudHooks = require('*/cartridge/scripts/flow/hooks/fraud');
    var flowApi = require('*/cartridge/scripts/flow/api/api');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

    var orderQry = 'status = {0} AND custom.flowOrderNumber != NULL AND creationDate > {1}';
    var startDate = options.startDate ? new Date(options.startDate) : new Date(0);
    var logger = FlowHelper.logger;
    var time = (new Date()).toISOString().substring(11, 19).replace(/:/g, '');
    var orders;
    var order;
    var csvLog;
    var fraudStatus;

    if (!FlowHelper.isFlowEnabled && !FlowHelper.enableJobs) {
        return new Status(Status.OK, null, 'Flow is disabled');
    }

    if (!startDate) {
        return new Status(Status.ERROR, null, 'Invalid Start Date Specified');
    }

    orders = OrderMgr.searchOrders(orderQry, null, Order.ORDER_STATUS_CREATED, startDate);

    if (!orders.count) {
        return new Status(Status.OK, null, 'No Flow Orders found');
    }

    JobHelper.createFolders();

    csvLog = JobHelper.createCSVFile(JobHelper.paths.FRAUDCHECK_FOLDER + '/fraud_check_' + time + '.csv');
    csvLog.row(['Order No', 'Flow Order Id', 'Creation Date', 'Fraud Status']);

    while (orders.hasNext()) {
        fraudStatus = null;
        order = orders.next();

        try {
            fraudStatus = flowApi.order.checkFraudStatus(order.custom.flowOrderNumber);
        } catch (e) {
            logger.error('Fraud check status not found for Order: ' + order.orderNo + ', ' + e.message);
            csvLog.row([order.orderNo, order.custom.flowOrderNumber, order.creationDate, 'Unknown']);
            FlowHelper.createNotificationObject({
                sfccOrderId: order.orderNo,
                notification: 'Fraud check status not found for SFCC Order',
                data: e.message
            });
        }

        if (fraudStatus === 'pending') {
            logger.warn('Fraud check status still pending for Order: ' + order.orderNo);
            csvLog.row([order.orderNo, order.custom.flowOrderNumber, order.creationDate, 'Pending']);
        } else if (fraudStatus) {
            setFraudStatus(order, fraudStatus);

            if (fraudStatus === 'approved') {
                logger.info('Fraud check approved for Order: ' + order.orderNo);
                csvLog.row([order.orderNo, order.custom.flowOrderNumber, order.creationDate, 'Approved']);

                hooksHelper('flow.fraud.approved', 'approved', order, fraudHooks.approved);
            } else if (fraudStatus === 'declined') {
                logger.warn('Fraud check declined for Order: ' + order.orderNo);
                csvLog.row([order.orderNo, order.custom.flowOrderNumber, order.creationDate, 'Declined']);

                hooksHelper('flow.fraud.declined', 'declined', order, fraudHooks.declined);
            } else if (fraudStatus === 'review') {
                logger.info('Fraud check needs review for Order: ' + order.orderNo);
                csvLog.row([order.orderNo, order.custom.flowOrderNumber, order.creationDate, 'Review']);

                // WGACA MODIFICATION - SFRA hook helper fallback handler callback
                // hooksHelper('flow.fraud.review', 'review', order);
                hooksHelper('flow.fraud.review', 'review', order, function () {});
            }
        } else {
            logger.error('Fraud check status not found for Order: ' + order.orderNo);
            csvLog.row([order.orderNo, order.custom.flowOrderNumber, order.creationDate, 'Unknown']);
            FlowHelper.createNotificationObject({
                sfccOrderId: order.orderNo,
                notification: 'Fraud check status not found for SFCC Order'
            });
        }
    }

    csvLog.close();
    JobHelper.archiveFile(csvLog.file, JobHelper.paths.FRAUDCHECK_ARCHIVE_FOLDER);

    return new Status(Status.OK, null, 'Flow Order Fraud Check successfully completed');
}

exports.updateOrderFraudStatus = updateOrderFraudStatus;
