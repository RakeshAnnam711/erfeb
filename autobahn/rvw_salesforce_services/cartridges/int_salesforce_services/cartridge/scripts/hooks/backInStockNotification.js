'use strict';

var site = require('dw/system/Site');
var logger = require('dw/system/Logger');

/* ***** Public Method declarations ***** */
var externalKeyJSONString = site.current.getCustomPreferenceValue('DataExtensionExternalKeyForBackInStock');

if (!empty(externalKeyJSONString)) {
    exports.subscribeBackInStockNotification = insertIntoBackInStockDataExtension;
} else {
    exports.subscribeBackInStockNotification = function () {};
}

/* ***** Public Functions definitions ***** */
/**
 * Function that handles adding a record into the data extension for tracking
 * Back in Stock Notifications (BISN).
 * @param {Object} req - the current request to the controller
 * @param {Object} res -the response coming from the controller
 * @returns {Object} simple status object to extend BISN for the front end communication
 */
function insertIntoBackInStockDataExtension(req, res) {
    var resultInfo = getEmptyResultInfo();
    var marketingManager = require('*/cartridge/scripts/marketing/MarketingManager');

    var backInStockInfo = getBackInStockInfo(req, res);
    if (backInStockInfo !== null) {
        setSubscriberKey(backInStockInfo);
        var items = [];
        items.push(backInStockInfo);

        var externalKey = marketingManager.GetExternalKey(externalKeyJSONString);
        var dataExtensionResponse = marketingManager.InsertIntoDataExtension(externalKey, items);

        resultInfo.msg = dataExtensionResponse.ErrorDescription;
        resultInfo.success = dataExtensionResponse.Successful;
        resultInfo.object = dataExtensionResponse;
    } else {
        logger.error('Cannot insert into the Back in Stock Notification data extension due to missing email or productId.');
    }

    return resultInfo;
}

function getEmptyResultInfo() {
    return {
        msg: 'Back In Stock Notification is Disabled',
        success: false,
        object: {}
    };
}

function getBackInStockInfo(req, res) {
    var viewData = res.getViewData();
    var formData = req.form;

    var email = formData.email || viewData.email;
    var productId = formData.pid || viewData.pid || req.querystring.pid;

    if (!empty(email) && !empty(productId)) {
        return {
            SubscriberKey: null,
            EmailAddress: email,
            ProductID: productId
        };
    }

    return null;
}

function setSubscriberKey(backInStockInfo) {
    var serviceManager = require('*/cartridge/scripts/service/ServiceManager');
    var objectNames = require('*/cartridge/scripts/constants/SalesforceConstants').ObjectNames;
    var updateContactIfExists = false;
    var subscriberKey = serviceManager.GetSubscriberKeyFromContactInfo(backInStockInfo.EmailAddress, '', '', objectNames.Account, updateContactIfExists);
    backInStockInfo.SubscriberKey = subscriberKey;
}
