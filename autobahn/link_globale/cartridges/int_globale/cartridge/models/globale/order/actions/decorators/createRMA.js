/* eslint-disable no-param-reassign */

'use strict';

/**
 * Creates GE to SFCC RMA notification
 * @throws {Error}
 * @param {Object} payload - RMA payload
 * @returns {dw.object.CustomObject} - notification custom object
 */
function createRMA(payload) {
    var Transaction = require('dw/system/Transaction');
    var UUIDUtils = require('dw/util/UUIDUtils');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');

    var notificationCo;
    delete payload.MerchantGUID;

    Transaction.wrap(function () {
        notificationCo = CustomObjectMgr.createCustomObject(globaleHelpers.customObjectKeys.coOrderNotification, UUIDUtils.createUUID());
        notificationCo.custom.geNotificationType = globaleHelpers.consts.notificationOrderRMACreate;
        notificationCo.custom.geOrderId = payload.OrderId;
        notificationCo.custom.geNotificationPayload = JSON.stringify(payload);
    });

    return notificationCo;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        createRMA: {
            value: createRMA
        }
    });
};
