'use strict';

var logger = require('dw/system/Logger');

/* ***** Public Method declarations ***** */
exports.sendPasswordResetEmail = sendPasswordResetEmail;

/* ***** Public Functions definitions ***** */
/**
 * This function will attempt to send a password reset email via Marketing Cloud.
 *  and return an object with the status.
 * @param {string} email - email for password reset
 * @param {Object} resettingCustomer - the customer requesting password reset
 * @returns {Object} responseInfo - An object that states if the email sent successfully
 * and holds the error message if any
 */
function sendPasswordResetEmail(email, resettingCustomer) {
	var responseInfo = {};
	responseInfo['EmailSuccessfullySent'] = false;
	responseInfo['ErrorMessage'];
	try {
		var site = require('dw/system/Site');
		var passwordResetEnabled = site.current.getCustomPreferenceValue('MarketingCloudForPasswordResetEnabled');
		if (passwordResetEnabled) {
			var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
			var marketingManager = require('*/cartridge/scripts/marketing/MarketingManager');
			var externalKeyJSONString = site.current.getCustomPreferenceValue('TriggeredSendExternalKeyForPasswordReset');

			var payload = accountHelpers.createPasswordResetPayload(resettingCustomer);
			setSubscriberKey(payload, resettingCustomer);
			var externalKey = marketingManager.GetExternalKey(externalKeyJSONString);
			var marketingDataResponse = marketingManager.ExecuteTriggeredSend(externalKey, payload);
			if ('RequestId' in marketingDataResponse && marketingDataResponse.RequestId.length > 0) {
				responseInfo.EmailSuccessfullySent = true;
				logger.info("Successfully sent password reset email to '" + payload.EmailAddress + "'.");
			}
		} else {
			responseInfo.ErrorMessage = 'Password Reset via Marketing Cloud is not enabled. No attempt to send the email was made through SFMC.';
		}
	} catch (ex) {
		responseInfo.ErrorMessage = "Unable to successfully send email. Error: " + ex + ".";
	}
	return responseInfo;
}

function setSubscriberKey(payload, resettingCustomer) {
	var serviceManager = require('*/cartridge/scripts/service/ServiceManager');
	var objectNames = require('*/cartridge/scripts/constants/SalesforceConstants').ObjectNames;
	var updateContactIfExists = false;
	var subscriberKey = serviceManager.GetSubscriberKeyFromContactInfo(payload.EmailAddress, resettingCustomer.profile.firstName, resettingCustomer.profile.lastName, objectNames.Account, updateContactIfExists);
	payload.SubscriberKey = subscriberKey;
}
