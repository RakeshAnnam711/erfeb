/* eslint-disable no-loop-func */

'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents OrderRefundUpdateOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function OrderRefundUpdateOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
OrderRefundUpdateOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Sends OrderRefundUpdate notification (SFCC->GE)
 * @throws {Error}
 */
OrderRefundUpdateOperation.prototype.run = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geServiceMgr = require('*/cartridge/scripts/factories/globale/geServiceMgr');

    var logger = globaleHelpers.getLogger();
    var service = geServiceMgr.getOrderRefundUpdateService();
    var initialServiceUrl = service.getURL();

    try {
        var notificationsIterator = this.getPendingNotifications(globaleHelpers.consts.notificationOrderRefundUpdate);
        var currentNotificationCo;
        var notificationPayload;
        var requestHeader;
        var requestBody;
        var serviceResultResponse;
        var coInfo;
        var order;

        this.operationResult.stats.total = notificationsIterator.getCount();

        while (notificationsIterator.hasNext()) {
            currentNotificationCo = notificationsIterator.next();
            coInfo = { coId: currentNotificationCo.custom.ID, orderId: currentNotificationCo.custom.geOrderId };

            try {
                // get order
                order = this.findOrder(currentNotificationCo.custom.geOrderId);

                // set notification payload
                notificationPayload = JSON.parse(currentNotificationCo.custom.geNotificationPayload);
                requestHeader = notificationPayload.header ? JSON.stringify(notificationPayload.header) : '';
                service.setURL(initialServiceUrl + ('&orderRefund=' + encodeURIComponent(requestHeader)));

                // check service result status
                requestBody = notificationPayload.body ? JSON.stringify(notificationPayload.body) : '';
                serviceResultResponse = this.getServiceResponse(service.call(requestBody));

                // check service result response
                if (
                    ('Success' in serviceResultResponse) ||
                    (('Code' in serviceResultResponse) && serviceResultResponse.Code) ||
                    (('Error' in serviceResultResponse) && serviceResultResponse.Error)
                ) {
                    this.removeNotificationCO(currentNotificationCo);
                    this.writeOrderNote(order, 'SFCC_to_GE_CreateOrderRefund', 'Order Refund Update was sent to Global-e.');

                    if (!serviceResultResponse.Success) {
                        this.operationResult.stats.errors++;
                    }
                } else {
                    throw Error('Unrecognized API response:' + JSON.stringify(serviceResultResponse));
                }

                this.operationResult.stats.processed++;
                logger.info(
                    'SFCC_to_GE_CreateOrderRefund: CO ID: {0}, Order ID: {1}, {2}',
                    coInfo.coId,
                    coInfo.orderId,
                    'Notification was sent. Response: ' + JSON.stringify(serviceResultResponse)
                );
            } catch (e) {
                this.operationResult.stats.failed++;
                logger.error(
                    'SFCC_to_GE_CreateOrderRefund: CO ID: {0}, Order ID: {1}, {2}',
                    coInfo.coId,
                    coInfo.orderId,
                    e.message + '; ' + e.stack
                );
            }
        }
        notificationsIterator.close();

        this.writeOrderStats(this.operationResult.stats, 'SFCC_to_GE_CreateOrderRefund');

        if (this.operationResult.stats.failed > 0 || this.operationResult.stats.errors > 0) {
            throw new Error('SFCC_to_GE_CreateOrderRefund is finished with errors');
        }
    } catch (e) {
        this.operationResult.success = false;
        throw e;
    }

    this.operationResult.success = true;
};

module.exports = OrderRefundUpdateOperation;
