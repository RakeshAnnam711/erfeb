'use strict';

var logger = require('dw/system/Logger');

/* ***** Public Method declarations ***** */
exports.sendAccountCreationEmail = sendAccountCreationEmail;

/* ***** Public Functions definitions ***** */
/**
 * This function will attempt to send an account creation email via Marketing Cloud.
 *  and return an object with the status.
 * @param {Object} registeredUser - the customer that was just created
 * @returns {Object} responseInfo - An object that states if the email sent successfully
 * and holds the error message if any
 */
function sendAccountCreationEmail(registeredUser) {
    var responseInfo = {};
    responseInfo['EmailSuccessfullySent'] = false;
    responseInfo['ErrorMessage'];
    try {
        var site = require('dw/system/Site');
        var accountCreationEnabled = site.current.getCustomPreferenceValue('MarketingCloudForAccountCreationEnabled');
        if (accountCreationEnabled) {
            var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
            var marketingManager = require('*/cartridge/scripts/marketing/MarketingManager');
            var externalKeyJSONString = site.current.getCustomPreferenceValue('TriggeredSendExternalKeyForAccountCreation');

            var payload = accountHelpers.createAccountCreationPayload(registeredUser);
            setSubscriberKey(payload);
            var externalKey = marketingManager.GetExternalKey(externalKeyJSONString);
            var marketingDataResponse = marketingManager.ExecuteTriggeredSend(externalKey, payload);
            if ('RequestId' in marketingDataResponse && marketingDataResponse.RequestId.length > 0) {
                responseInfo.EmailSuccessfullySent = true;
                logger.info("Successfully sent account creation email to '" + payload.EmailAddress + "'.");
            }
        } else {
            responseInfo.ErrorMessage = 'Account Creation via Marketing Cloud is not enabled. No attempt to send the email was made through SFMC.';
        }
    } catch (ex) {
        responseInfo.ErrorMessage = "Unable to successfully send email. Error: " + ex + ".";
    }
    return responseInfo;
}

function setSubscriberKey(payload) {
    var serviceManager = require('*/cartridge/scripts/service/ServiceManager');
    var objectNames = require('*/cartridge/scripts/constants/SalesforceConstants').ObjectNames;
    var updateContactIfExists = false;
    var subscriberKey = serviceManager.GetSubscriberKeyFromContactInfo(payload.EmailAddress, payload.FirstName, payload.LastName, objectNames.Account, updateContactIfExists);
    payload.SubscriberKey = subscriberKey;
}
