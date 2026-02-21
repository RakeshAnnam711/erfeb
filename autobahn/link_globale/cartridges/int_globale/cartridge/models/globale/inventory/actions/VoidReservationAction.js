'use strict';

var AbstractAction = require('*/cartridge/models/globale/generic/AbstractAction');

/**
 * Represents VoidReservationAction
 * @constructor
 * @param {Object} requestObj - request object
 * @param {Object} responseObj - response object
 */
function VoidReservationAction(requestObj, responseObj) {
    AbstractAction.call(this, requestObj, responseObj);
}

/* Inherits AbstractAction */
VoidReservationAction.prototype = Object.create(AbstractAction.prototype);

/**
 * Update Order RMA
 * @throws {Error}
 */
VoidReservationAction.prototype.run = function () {
    var Transaction = require('dw/system/Transaction');
    var UUIDUtils = require('dw/util/UUIDUtils');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
    var globaleHooksHelper = require('*/cartridge/scripts/helpers/globaleHooksHelper');

    var notificationCo;

    var notificationData = {
        OrderId: this.request.payload.OrderId,
        ReservationRequestId: this.request.payload.ReservationRequestId
    };

    // invoke onAfterInventoryVoidReservation hook (sync processing)
    var result = globaleHooksHelper.invokeCustomHook(globaleHelpers.hooks.inventory.onAfterVoidReservation, notificationData);
    if (!!result === false) {
        // create GE to SFCC InventoryVoidReservation notification (async processing if needed)
        Transaction.wrap(function () {
            notificationCo = CustomObjectMgr.createCustomObject(globaleHelpers.customObjectKeys.coInventoryNotification, UUIDUtils.createUUID());
            notificationCo.custom.geNotificationType = globaleHelpers.consts.notificationInventoryVoidReservation;
            notificationCo.custom.geNotificationPayload = JSON.stringify(notificationData);
            notificationCo.custom.geOrderId = notificationData.OrderId;
        });
    }

    this.response.success = true;
};

module.exports = VoidReservationAction;
