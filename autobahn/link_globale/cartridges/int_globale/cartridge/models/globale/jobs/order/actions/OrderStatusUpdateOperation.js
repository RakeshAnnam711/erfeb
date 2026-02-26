/* eslint-disable no-loop-func */

'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents OrderStatusUpdateOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function OrderStatusUpdateOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
OrderStatusUpdateOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Sends OrderStatusUpdate notification (SFCC->GE)
 * @throws {Error}
 */
OrderStatusUpdateOperation.prototype.run = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geServiceMgr = require('*/cartridge/scripts/factories/globale/geServiceMgr');

    var logger = globaleHelpers.getLogger();
    var service = geServiceMgr.getOrderStatusUpdateService();
    var initialServiceUrl = service.getURL();

    try {
        var notificationsIterator = this.getPendingNotifications(globaleHelpers.consts.notificationOrderStatusUpdate);
        var currentNotificationCo;
        var notificationPayload;
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
                service.setURL(initialServiceUrl + ('&orderStatus=' + encodeURIComponent(JSON.stringify(notificationPayload))));

                // check service result status
                serviceResultResponse = this.getServiceResponse(service.call(''));

                // check service result response
                if (
                    ('Success' in serviceResultResponse) ||
                    (('Code' in serviceResultResponse) && serviceResultResponse.Code) ||
                    (('Error' in serviceResultResponse) && serviceResultResponse.Error)
                ) {
                    this.removeNotificationCO(currentNotificationCo);
                    this.writeOrderNote(order, 'SFCC_to_GE_UpdateOrderStatus', 'Order Status Update was sent to Global-e.');

                    if (!serviceResultResponse.Success) {
                        this.operationResult.stats.errors++;
                    }
                } else {
                    throw Error('Unrecognized API response:' + JSON.stringify(serviceResultResponse));
                }

                this.operationResult.stats.processed++;
                logger.info(
                    'SFCC_to_GE_UpdateOrderStatus: CO ID: {0}, Order ID: {1}, {2}',
                    coInfo.coId,
                    coInfo.orderId,
                    'Notification was sent. Response: ' + JSON.stringify(serviceResultResponse)
                );
            } catch (e) {
                this.operationResult.stats.failed++;
                logger.error(
                    'SFCC_to_GE_UpdateOrderStatus: CO ID: {0}, Order ID: {1}, {2}',
                    coInfo.coId,
                    coInfo.orderId,
                    e.message + '; ' + e.stack
                );
            }
        }
        notificationsIterator.close();

        this.writeOrderStats(this.operationResult.stats, 'SFCC_to_GE_UpdateOrderStatus');

        if (this.operationResult.stats.failed > 0 || this.operationResult.stats.errors > 0) {
            throw new Error('SFCC_to_GE_UpdateOrderStatus is finished with errors');
        }
    } catch (e) {
        this.operationResult.success = false;
        throw e;
    }

    this.operationResult.success = true;
};

module.exports = OrderStatusUpdateOperation;
