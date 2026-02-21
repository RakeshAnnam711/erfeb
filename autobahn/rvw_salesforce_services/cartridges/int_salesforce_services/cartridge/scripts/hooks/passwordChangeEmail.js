'use strict';

var logger = require('dw/system/Logger');

/* ***** Public Method declarations ***** */
exports.sendPasswordChangeEmail = sendPasswordChangeEmail;

/* ***** Public Functions definitions ***** */
/**
 * This function will attempt to send a password change email via Marketing Cloud.
 *  and return an object with the status.
 * @param {string} email - email for password change
 * @param {Object} changingCustomer - the customer completing password change
 * @returns {Object} responseInfo - An object that states if the email sent successfully
 * and holds the error message if any
 */
function sendPasswordChangeEmail(email, changingCustomer) {
	var responseInfo = {};
	responseInfo['EmailSuccessfullySent'] = false;
	responseInfo['ErrorMessage'];
	try {
		var site = require('dw/system/Site');
		var passwordChangeEnabled = site.current.getCustomPreferenceValue('MarketingCloudForPasswordChangeEnabled');
		if (passwordChangeEnabled) {
			var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
			var marketingManager = require('*/cartridge/scripts/marketing/MarketingManager');
			var externalKeyJSONString = site.current.getCustomPreferenceValue('TriggeredSendExternalKeyForPasswordChange');

			var payload = accountHelpers.createPasswordChangePayload(changingCustomer);
			setSubscriberKey(payload, changingCustomer);
			var externalKey = marketingManager.GetExternalKey(externalKeyJSONString);
			var marketingDataResponse = marketingManager.ExecuteTriggeredSend(externalKey, payload);
			if ('RequestId' in marketingDataResponse && marketingDataResponse.RequestId.length > 0) {
				responseInfo.EmailSuccessfullySent = true;
				logger.info("Successfully sent password change email to '" + payload.EmailAddress + "'.");
			}
		} else {
			responseInfo.ErrorMessage = 'Password Change via Marketing Cloud is not enabled. No attempt to send the email was made through SFMC.';
		}
	} catch (ex) {
		responseInfo.ErrorMessage = "Unable to successfully send email. Error: " + ex + ".";
	}
	return responseInfo;
}

function setSubscriberKey(payload, changingCustomer) {
	var serviceManager = require('*/cartridge/scripts/service/ServiceManager');
	var objectNames = require('*/cartridge/scripts/constants/SalesforceConstants').ObjectNames;
	var updateContactIfExists = false;
	var subscriberKey = serviceManager.GetSubscriberKeyFromContactInfo(payload.EmailAddress, changingCustomer.profile.firstName, changingCustomer.profile.lastName, objectNames.Account, updateContactIfExists);
	payload.SubscriberKey = subscriberKey;
}
