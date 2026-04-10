/* global dw, empty */
/**
* This module provides integrations with the Zenkraft API via SFCC Jobs.
*
* @module  modules/zenkraftJobs
*/

'use strict';

/**
* Send customer notification
*
* @return {date}
*/
function sendNotification (notify, stage, shipmentNo, orderNo, trackStage, estimatedDate) {
    var Notify = require('~/cartridge/scripts/notifications');
    var notificationsData = notify.split(',');
    notificationsData.forEach(function (notificationData) {
        var notificationArray = notificationData.split(';');
        var notifyType = notificationArray[0];
        var notifyContact = notificationArray[1];
        if (notifyType === 'sms') {
            // Connect to your sms service provider
            Notify.SendSMSNotification(
                notifyContact,
                stage,
                shipmentNo,
                orderNo,
                trackStage,
                estimatedDate
            );
        }
        if (notifyType === 'email') {
            // Connect to your email marketing server
        }
    });
}

/**
* Update System Shipment with Zenkraft tracking info
*
* @return {void}
*/
function updateSystemShipment(shipment, trackInfo, orderNo) {
    var Transaction = require('dw/system/Transaction');
    var zenkraftHelper = require('~/cartridge/scripts/helpers/zenkraftHelper.js');
    if (!shipment.custom.zenkraft_tracking_stage || shipment.custom.zenkraft_tracking_stage !== trackInfo.tracking_stage) {
        Transaction.wrap(function () {
            shipment.custom.zenkraft_estimated_date = trackInfo.estimated_delivery ? zenkraftHelper.setDate(trackInfo.estimated_delivery) : null;
            shipment.custom.zenkraft_shipment_status = !empty(trackInfo.status) ? trackInfo.status : '';
            shipment.custom.zenkraft_tracking_stage = !empty(trackInfo.tracking_stage) ? trackInfo.tracking_stage : '';
            if (trackInfo.checkpoints && trackInfo.checkpoints.length > 0) {
                shipment.custom.zenkraft_checkpoints = JSON.stringify({ checkpoints: trackInfo.checkpoints });
                shipment.custom.zenkraft_shipment_description = !empty(trackInfo.checkpoints[0].description) ? trackInfo.checkpoints[0].description : '';
                shipment.custom.zenkraft_time = !empty(trackInfo.checkpoints[0].time) ? zenkraftHelper.setTime(trackInfo.checkpoints[0].time) : null;
            }
            if (shipment.custom.zenkraft_notification_type && shipment.custom.zenkraft_notification_type.indexOf(':') > -1) {
                shipment.custom.zenkraft_last_notification_sent = new Date();
                sendNotification(
                    shipment.custom.zenkraft_notification_type,
                    shipment.custom.zenkraft_shipment_status,
                    shipment.shipmentNo,
                    orderNo,
                    shipment.custom.zenkraft_tracking_stage,
                    shipment.custom.zenkraft_estimated_date
                );
            }
        });
    }
}
/**
* Update zenkraftParcelObject with Zenkraft tracking info
*
* @return {void}
*/
function updateParcelObject(parcel, trackInfo) {
    var Transaction = require('dw/system/Transaction');
    var zenkraftHelper = require('~/cartridge/scripts/helpers/zenkraftHelper.js');
    if (!parcel.custom.trackingStage || parcel.custom.trackingStage !== trackInfo.tracking_stage) {
        Transaction.wrap(function () {
            parcel.custom.status = !empty(trackInfo.status) ? trackInfo.status : '';
            parcel.custom.estimatedDate = trackInfo.estimated_delivery ? zenkraftHelper.setDate(trackInfo.estimated_delivery) : null;
            parcel.custom.trackingStage = empty(trackInfo.tracking_stage) ? trackInfo.tracking_stage : '';
            if (trackInfo.checkpoints && trackInfo.checkpoints.length > 0) {
                parcel.custom.checkpoints = JSON.stringify({ checkpoints: trackInfo.checkpoints });
                parcel.custom.statusDescription = !empty(trackInfo.checkpoints[0].description) ? trackInfo.checkpoints[0].description : '';
                parcel.custom.lastCarrierUpdate = !empty(trackInfo.checkpoints[0].time) ? zenkraftHelper.setTime(trackInfo.checkpoints[0].time) : null;
            }
            if (parcel.custom.notificationType && parcel.custom.notificationType.indexOf(':') > -1) {
                parcel.custom.lastNotificationSent = new Date();
                sendNotification(
                    parcel.custom.notificationType,
                    parcel.custom.status,
                    parcel.custom.shipmentNo,
                    parcel.custom.orderNo,
                    parcel.custom.trackingStage,
                    parcel.custom.estimatedDate
                );
            }
        });
    }
}

/**
* Get tracking information
*
* @return {void}
*/
function getTrackingInfo(objects, type, orderNo) {
    var Zenkraft = require('~/cartridge/scripts/zenkraft');
    var trackInfo;
    objects.forEach(function (object) {
        if (type === 'parcel') {
            trackInfo = Zenkraft.getTrackingInfo(object.getCustom().trackingNumber, object.getCustom().carrier);
            if (!trackInfo.error && !empty(trackInfo.tracking_stage)) {
                updateParcelObject(object, trackInfo);
            }
        } else {
            trackInfo = Zenkraft.getTrackingInfo(object.trackingNumber, object.getCustom().zenkraftCarrier);
            if (!trackInfo.error && !empty(trackInfo.tracking_stage)) {
                updateSystemShipment(object, trackInfo, orderNo);
            }
        }
    });
}

/**
* Iterates through Notifications Custom Objects, determines if a change was made
* and send a shipping notification through the selected channel if necessary.
*
*/
var sendShippingNotifications = function sendNotify(data) {
    var day = data.day ? parseInt(data.day) : false;
    var month = data.month ? parseInt(data.month - 1) : false;
    var year = data.year ? parseInt(data.year) : false;
    var date = day && month && year ? new Date(year, month, day) : false;
    var Site = require('dw/system/Site');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var OrderMgr = require('dw/order/OrderMgr');
    var useParcelObjectforTracking = Site.getCurrent().getCustomPreferenceValue('useParcelObjectforTracking');
    var shipments;
    var orders;

    if (useParcelObjectforTracking) {
        shipments = CustomObjectMgr.queryCustomObjects('zenkraftParcel', "custom.trackingNumber != NULL AND custom.carrier != NULL", null).asList().toArray();
        getTrackingInfo(shipments, 'parcel');
    } else {
        orders = OrderMgr.searchOrders("creationDate >= {0}", null, date);
        while (orders.hasNext()) {
            var order = orders.next();
            var orderShipments = order.getShipments().toArray();
            orderShipments.filter(function (shipment) {
                if (shipment.trackingNumber && shipment.trackingNumber.length > 0 && shipment.getCustom().zenkraftCarrier && shipment.getCustom().zenkraftCarrier.length > 0) {
                    return true;
                }
                return false;
            });
            getTrackingInfo(orderShipments, 'shipment', order.orderNo);
        }
    }
    return;
};
module.exports.SendShippingNotifications = sendShippingNotifications;
