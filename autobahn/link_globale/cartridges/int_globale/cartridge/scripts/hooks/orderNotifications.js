'use strict';

/**
 * Initiates order status update notification
 * @param {string} orderId - SFCC order ID
 * @param {Object} payload - notification payload
 * @returns {Object} - TB removed, instead the system status should be returned
 */
function outboundOrderStatusUpdate(orderId, payload) {
    var Status = require('dw/system/Status');
    var Transaction = require('dw/system/Transaction');
    var UUIDUtils = require('dw/util/UUIDUtils');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var logger = globaleHelpers.getLogger();
    try {
        Transaction.wrap(function () {
            var orderStatusNotificationUpdate = CustomObjectMgr.createCustomObject(globaleHelpers.customObjectKeys.coOrderNotification, UUIDUtils.createUUID());
            orderStatusNotificationUpdate.custom.geNotificationType = globaleHelpers.consts.notificationOrderStatusUpdate;
            orderStatusNotificationUpdate.custom.geOrderId = orderId;
            orderStatusNotificationUpdate.custom.geNotificationPayload = JSON.stringify(payload);
        });
    } catch (e) {
        logger.error('HOOK_HANDLER: outboundOrderStatusUpdate: {0}', logger.message(e));
        return new Status(Status.ERROR, '', logger.message(e));
    }

    return new Status(Status.OK);
}

/**
 * Initiates order dispatch update notification
 * @param {string} orderId - SFCC order ID
 * @param {Object} payload - notification payload
 * @returns {Object} - TB removed, instead the system status should be returned
 */
function outboundOrderDispatchUpdate(orderId, payload) {
    var Status = require('dw/system/Status');
    var Transaction = require('dw/system/Transaction');
    var UUIDUtils = require('dw/util/UUIDUtils');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var logger = globaleHelpers.getLogger();
    try {
        Transaction.wrap(function () {
            var orderStatusNotificationUpdate = CustomObjectMgr.createCustomObject(globaleHelpers.customObjectKeys.coOrderNotification, UUIDUtils.createUUID());
            orderStatusNotificationUpdate.custom.geNotificationType = globaleHelpers.consts.notificationOrderDispatchUpdate;
            orderStatusNotificationUpdate.custom.geOrderId = orderId;
            orderStatusNotificationUpdate.custom.geNotificationPayload = JSON.stringify(payload);
        });
    } catch (e) {
        logger.error('HOOK_HANDLER: outboundOrderDispatchUpdate: {0}', logger.message(e));
        return new Status(Status.ERROR, '', logger.message(e));
    }

    return new Status(Status.OK);
}

/**
 * Initiates order refund update notification
 * @param {string} orderId - SFCC order ID
 * @param {Object} payload - notification payload (should include header and body properties)
 * @returns {dw.system.Status} - status
 */
function outboundOrderRefundUpdate(orderId, payload) {
    var Status = require('dw/system/Status');
    var Transaction = require('dw/system/Transaction');
    var UUIDUtils = require('dw/util/UUIDUtils');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var logger = globaleHelpers.getLogger();
    try {
        Transaction.wrap(function () {
            var orderStatusNotificationUpdate = CustomObjectMgr.createCustomObject(globaleHelpers.customObjectKeys.coOrderNotification, UUIDUtils.createUUID());
            orderStatusNotificationUpdate.custom.geNotificationType = globaleHelpers.consts.notificationOrderRefundUpdate;
            orderStatusNotificationUpdate.custom.geOrderId = orderId;
            orderStatusNotificationUpdate.custom.geNotificationPayload = JSON.stringify(payload);
        });
    } catch (e) {
        logger.error('HOOK_HANDLER: outboundOrderRefundUpdate: {0}', logger.message(e));
        return new Status(Status.ERROR, '', logger.message(e));
    }

    return new Status(Status.OK);
}

/**
 * Initiates order RMA update notification
 * @param {string} orderId - SFCC order ID
 * @param {Object} payload - notification payload
 * @returns {dw.system.Status} - status
 */
function outboundOrderRMAUpdate(orderId, payload) {
    var Status = require('dw/system/Status');
    var Transaction = require('dw/system/Transaction');
    var UUIDUtils = require('dw/util/UUIDUtils');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var logger = globaleHelpers.getLogger();
    try {
        Transaction.wrap(function () {
            var orderStatusNotificationUpdate = CustomObjectMgr.createCustomObject(globaleHelpers.customObjectKeys.coOrderNotification, UUIDUtils.createUUID());
            orderStatusNotificationUpdate.custom.geNotificationType = globaleHelpers.consts.notificationOrderRMAUpdate;
            orderStatusNotificationUpdate.custom.geOrderId = orderId;
            orderStatusNotificationUpdate.custom.geNotificationPayload = JSON.stringify(payload);
        });
    } catch (e) {
        logger.error('HOOK_HANDLER: outboundOrderRMAUpdate: {0}', logger.message(e));
        return new Status(Status.ERROR, '', logger.message(e));
    }

    return new Status(Status.OK);
}

module.exports = {
    outboundOrderStatusUpdate: outboundOrderStatusUpdate,
    outboundOrderDispatchUpdate: outboundOrderDispatchUpdate,
    outboundOrderRefundUpdate: outboundOrderRefundUpdate,
    outboundOrderRMAUpdate: outboundOrderRMAUpdate
};
