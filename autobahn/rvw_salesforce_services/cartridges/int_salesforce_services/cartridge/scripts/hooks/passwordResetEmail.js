'use strict';

var logger = require('dw/system/Logger');

/* ***** Public Method declarations ***** */
exports.sendPasswordResetEmail = sendPasswordResetEmail;

/* ***** Public Functions definitions ***** */
/**
 * This function will attempt to send a password reset email via Marketing Cloud (when enabled).
 * If Marketing Cloud did not send it, the reset is sent to Zeta as a 'password_reset' activity and
 * Zeta owns the email instead. Returns an object with the status.
 * @param {string} email - email for password reset
 * @param {Object} resettingCustomer - the customer requesting password reset
 * @returns {Object} responseInfo - An object that states if the email sent successfully
 * and holds the error message if any
 */
function sendPasswordResetEmail(email, resettingCustomer) {
	var site = require('dw/system/Site');
	var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
	var passwordResetEnabled = site.current.getCustomPreferenceValue('MarketingCloudForPasswordResetEnabled');

	// Building the payload mints the reset token, so it must happen exactly once per request: every
	// new token invalidates the previous one and would break a link already handed to the customer.
	var payload = accountHelpers.createPasswordResetPayload(resettingCustomer);
	var errorMessages = [];

	var responseInfo = {};
	responseInfo.EmailSuccessfullySent = false;
	responseInfo.resetLink = payload;

	if (passwordResetEnabled) {
		// A failure here must not prevent the Zeta activity below from being sent.
		try {
			var marketingManager = require('*/cartridge/scripts/marketing/MarketingManager');
			var externalKeyJSONString = site.current.getCustomPreferenceValue('TriggeredSendExternalKeyForPasswordReset');

			setSubscriberKey(payload, resettingCustomer);
			var externalKey = marketingManager.GetExternalKey(externalKeyJSONString);
			var marketingDataResponse = marketingManager.ExecuteTriggeredSend(externalKey, payload);
			if (marketingDataResponse && !empty(marketingDataResponse.RequestId)) {
				responseInfo.EmailSuccessfullySent = true;
				logger.info("Successfully sent password reset email to '" + payload.EmailAddress + "'.");
			} else {
				errorMessages.push('Marketing Cloud did not return a RequestId for the password reset triggered send.');
			}
		} catch (ex) {
			errorMessages.push('Unable to successfully send email. Error: ' + ex + '.');
		}
	} else {
		errorMessages.push('Password Reset via Marketing Cloud is not enabled. No attempt to send the email was made through SFMC.');
	}

	if (responseInfo.EmailSuccessfullySent) {
		return responseInfo;
	}

	var zetaResult = trackZetaPasswordResetEvent(email, resettingCustomer, payload);
	if (zetaResult.accepted) {
		responseInfo.EmailSuccessfullySent = true;
	} else {
		errorMessages.push(zetaResult.errorMessage);
	}

	if (!responseInfo.EmailSuccessfullySent) {
		responseInfo.ErrorMessage = errorMessages.join(' ');
	}

	return responseInfo;
}

/**
 * Sends the 'password_reset' activity to Zeta. Never throws; a failure is logged and reported back
 * so that the caller can decide whether the SFRA fallback email is still needed.
 * @param {string} email - email for password reset
 * @param {Object} resettingCustomer - the customer requesting password reset
 * @param {Object} payload - the password reset payload holding the reset URL
 * @returns {Object} - An object holding whether Zeta accepted the activity and the error message if any
 */
function trackZetaPasswordResetEvent(email, resettingCustomer, payload) {
	var result = {
		accepted: false,
		errorMessage: ''
	};

	try {
		var zetaTrackEventService = require('*/cartridge/scripts/services/zetaTrackEventService');
		var zetaPayload = {
			activity: {
				subscriber: {
					uid: email
				},
				event: 'password_reset',
				timestamp: new Date().toISOString(),
				properties: {
					account_id: resettingCustomer.profile.customerNo,
					phone: resettingCustomer.profile.phoneHome || '',
					password_reset_method: 'Email',
					password_reset_status: '',
					reset_initiated: true,
					reset_completed: false,
					reset_link: payload.PWResetURL || '',
					two_factor_used: false,
					email: email,
					password_reset_timestamp: new Date().toISOString(),
					ip_address: request.httpRemoteAddress || '',
					user_agent: request.httpUserAgent || ''
				}
			}
		};

		logger.info('Zeta Payload: {0}', JSON.stringify(zetaPayload));

		var zetaResponse = zetaTrackEventService.call({
			payload: zetaPayload
		});

		if (zetaResponse.ok) {
			result.accepted = true;
			if (zetaResponse.object && zetaResponse.object.accepted) {
				logger.info('Zeta event accepted (202)');
			} else {
				logger.info('Zeta event success');
			}
		} else {
			result.errorMessage = 'Zeta API failed: ' + zetaResponse.errorMessage + '.';
			logger.error(result.errorMessage);
		}
	} catch (ex) {
		result.errorMessage = 'Unable to send the Zeta password reset event. Error: ' + ex + '.';
		logger.error(result.errorMessage);
	}

	return result;
}

function setSubscriberKey(payload, resettingCustomer) {
	var serviceManager = require('*/cartridge/scripts/service/ServiceManager');
	var objectNames = require('*/cartridge/scripts/constants/SalesforceConstants').ObjectNames;
	var updateContactIfExists = false;
	var subscriberKey = serviceManager.GetSubscriberKeyFromContactInfo(payload.EmailAddress, resettingCustomer.profile.firstName, resettingCustomer.profile.lastName, objectNames.Account, updateContactIfExists);
	payload.SubscriberKey = subscriberKey;
}
