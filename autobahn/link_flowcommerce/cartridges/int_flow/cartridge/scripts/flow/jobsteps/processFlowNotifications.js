'use strict';

/**
 * Base64 encode file data
 * @param {Object} data - File data
 * @returns {Object} Base 64 encoded data
 */
function base64Encode(data) {
    var StringUtils = require('dw/util/StringUtils');

    var b64 = StringUtils.encodeBase64(data.join('\r\n'));
    var re = /.{1,76}/g;
    var chunks = b64.match(re);
    return chunks.join('\r\n');
}

/**
 * Processes the Flow Notification custom objects
 * @param {Object} options - Job options
 * @returns {dw.system.Status} Status Code
 */
function processFlowNotifications(options) {
    var Mail = require('dw/net/Mail');
    var Status = require('dw/system/Status');
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var HashMap = require('dw/util/HashMap');
    var Template = require('dw/util/Template');
    var messageDigest = require('dw/crypto/MessageDigest');
    var FlowHelper = require('*/cartridge/scripts/flow/helpers/flowHelper');

    var notificationObjects = CustomObjectMgr.getAllCustomObjects('flowNotification');
    var toAddresses = options.toAddresses;
    var params = new HashMap();
    var template = new Template('flow/logMail.isml');
    var now = new Date();
    var notification;
    var mail;
    var content;
    var notifications = [];

    notifications.push('flowOrderId\tsfccOrderId\tcreationDate\tnotification\tdata');

    if (!FlowHelper.isFlowEnabled && !FlowHelper.enableJobs) {
        return new Status(Status.OK, null, 'Flow is disabled');
    }

    if (!toAddresses) {
        return new Status(Status.ERROR, null, 'No to address was specified');
    }

    Transaction.wrap(function () {
        while (notificationObjects.hasNext()) {
            notification = notificationObjects.next();
            notifications.push(notification.custom.flowOrderId + '\t' + notification.custom.sfccOrderId + '\t' + notification.getCreationDate() + '\t' + notification.custom.notification + '\t' + notification.custom.data);
            CustomObjectMgr.remove(notification);
        }
    });

    if (notifications.length > 1) {
        mail = new Mail();

        params.hash = messageDigest('MD5').digest(now).toString('iso-8859-1');
        params.contentType = 'multipart/mixed; boundary=' + params.hash;
        params.boundary = '--' + params.hash;
        params.body = 'Flow notifications';
        params.attachment = base64Encode(notifications);
        params.eom = params.boundary + '--';

        content = template.render(params);

        mail = new Mail();

        toAddresses.split(',').forEach(function (address) {
            mail.addTo(address.trim());
        });

        mail.setSubject('Flow Notifications - ' + FlowHelper.organizationId + ' - ' + FlowHelper.siteId);
        mail.setFrom('no-reply@logs-sfcc.flow.io');
        mail.setContent(content);
        mail.send();
    }

    return new Status(Status.OK, null, 'Flow Notifications successfully processed');
}

exports.processFlowNotifications = processFlowNotifications;
