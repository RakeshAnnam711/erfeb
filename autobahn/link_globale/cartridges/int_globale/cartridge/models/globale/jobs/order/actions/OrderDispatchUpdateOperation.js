/* eslint-disable no-loop-func */

'use strict';

var AbstractOperation = require('*/cartridge/models/globale/generic/AbstractOperation');

/**
 * Represents OrderDispatchUpdateOperation
 * @constructor
 * @param {Object} data - operation data
 * @param {Object} result - result object
 */
function OrderDispatchUpdateOperation(data, result) {
    AbstractOperation.call(this, data, result);
}

/* Inherits AbstractOperation */
OrderDispatchUpdateOperation.prototype = Object.create(AbstractOperation.prototype);

/**
 * Sends OrderDispatchUpdateOperation notification (SFCC->GE)
 * @throws {Error}
 */
OrderDispatchUpdateOperation.prototype.run = function () {
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var geServiceMgr = require('*/cartridge/scripts/factories/globale/geServiceMgr');

    var logger = globaleHelpers.getLogger();
    var service = geServiceMgr.getOrderDispatchUpdateService();

    try {
        var notificationsIterator = this.getPendingNotifications(globaleHelpers.consts.notificationOrderDispatchUpdate);
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

                // set notification paload
                notificationPayload = JSON.parse(currentNotificationCo.custom.geNotificationPayload);

                // check servise result status
                serviceResultResponse = this.getServiceResponse(service.call(JSON.stringify(notificationPayload)));

                // check service result response
                if (
                    ('Success' in serviceResultResponse) ||
                    (('Code' in serviceResultResponse) && serviceResultResponse.Code) ||
                    (('Error' in serviceResultResponse) && serviceResultResponse.Error)
                ) {
                    this.removeNotificationCO(currentNotificationCo);
                    this.writeOrderNote(order, 'SFCC_to_GE_UpdateOrderDispatch', 'Order Dispatch Update was sent to Global-e.');

                    if (!serviceResultResponse.Success) {
                        this.operationResult.stats.errors++;
                    }
                } else {
                    throw Error('Unrecognized API response:' + JSON.stringify(serviceResultResponse));
                }

                this.operationResult.stats.processed++;
                logger.info(
                    'SFCC_to_GE_UpdateOrderDispatch: CO ID: {0}, Order ID: {1}, {2}',
                    coInfo.coId,
                    coInfo.orderId,
                    'Notification was sent. Response: ' + JSON.stringify(serviceResultResponse)
                );
            } catch (e) {
                this.operationResult.stats.failed++;
                logger.error(
                    'SFCC_to_GE_UpdateOrderDispatch: CO ID: {0}, Order ID: {1}, {2}',
                    coInfo.coId,
                    coInfo.orderId,
                    e.message + '; ' + e.stack
                );
            }
        }
        notificationsIterator.close();

        this.writeOrderStats(this.operationResult.stats, 'SFCC_to_GE_UpdateOrderDispatch');

        if (this.operationResult.stats.failed > 0 || this.operationResult.stats.errors > 0) {
            throw new Error('SFCC_to_GE_UpdateOrderDispatch is finished with errors');
        }
    } catch (e) {
        this.operationResult.success = false;
        throw e;
    }

    this.operationResult.success = true;
};

module.exports = OrderDispatchUpdateOperation;
