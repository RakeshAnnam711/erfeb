'use strict';

var logger = require('dw/system/Logger');

/* ***** Public Method declarations ***** */
exports.sendOrderConfirmationEmail = sendOrderConfirmationEmail;

/* ***** Public Functions definitions ***** */

/**
 * This function will attempt send the a confirmation email via Marketing Cloud.
 * If the email fails to send it will update the responseInfo object with the error
 * encountered.
 * @param {dw.order.Order} order - The order object
 * @returns {Object} responseInfo - An object that states if the email sent successfully
 * and holds the error message if any
 */
function sendOrderConfirmationEmail(responseInfo, order, locale) {
    responseInfo = responseInfo || {};
    responseInfo['EmailSuccessfullySent'] = false;
    responseInfo['ErrorMessage'];

    try {
        var site = require('dw/system/Site');
        var orderConfirmEnabled = site.current.getCustomPreferenceValue('MarketingCloudForOrderConfirmationEnabled');
        if (orderConfirmEnabled) {
            var confirmationEmailHelper = require('../helpers/ConfirmationEmailHelper');
            var marketingManager = require('*/cartridge/scripts/marketing/MarketingManager');
            var externalKeyJSONString = site.current.getCustomPreferenceValue('TriggeredSendExternalKeyForOrderConfirmation');

            var payload = confirmationEmailHelper.createOrderPayload(order, locale);
            setSubscriberKey(payload);
            var externalKey = marketingManager.GetExternalKey(externalKeyJSONString);
            var marketingDataResponse = marketingManager.ExecuteTriggeredSend(externalKey, payload);
            if ('RequestId' in marketingDataResponse && marketingDataResponse.RequestId.length > 0) {
                responseInfo.EmailSuccessfullySent = true;
                logger.info("Successfully sent confirmation email to '" + payload.EmailAddress + "'.");
            }
        } else {
            responseInfo.ErrorMessage = 'Order Confirmation via Marketing Cloud is not enabled. No attempt to send the email was made through SFMC.';
        }
    }
    catch (ex) {
        responseInfo.ErrorMessage = "Unable to successfully send email. Error: " + ex + ".";
    }

    // no return to allow hook chaining with amended responseInfo
}

function setSubscriberKey(payload) {
    var serviceManager = require('*/cartridge/scripts/service/ServiceManager');
    var objectNames = require('*/cartridge/scripts/constants/SalesforceConstants').ObjectNames;
    var updateContactIfExists = false;
    var subscriberKey = serviceManager.GetSubscriberKeyFromContactInfo(payload.EmailAddress, payload.FirstName, payload.ShippingAddressLastName, objectNames.Account, updateContactIfExists);
    payload.SubscriberKey = subscriberKey;
}
