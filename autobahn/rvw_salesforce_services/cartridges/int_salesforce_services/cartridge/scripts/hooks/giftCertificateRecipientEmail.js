'use strict';

var Site = require('dw/system/Site');

var giftCertificateEnabled = Site.current.getCustomPreferenceValue('MarketingCloudForGiftCertificateEnabled');

/* ***** Public Method declarations ***** */
exports.sendGiftCertificateRecipientEmails = giftCertificateEnabled ? sendRecipientEmails : function () {};

/* ***** Public Functions definitions ***** */
/**
 * This function will attempt to send an email for each gift certificate recipient via Marketing Cloud.
 *  and return an object with the status and a list of all failed emails.
 * @param {Object} orderDetails - An object composed of some details from current order:
 * current hostname, customer email and a list of gift certificates
 * @returns {Object} responseInfo - An object that states if the email(s) sent successfully
 * and holds the error message if any
 */
function sendRecipientEmails(orderDetails) {
	var responseInfo = getEmptyResponseInfo();

	try {
		var marketingDataResponse = null;

		if (giftCertificateEnabled) {
			var marketingManager = require('*/cartridge/scripts/marketing/MarketingManager');
			var externalKeyJSONString = Site.current.getCustomPreferenceValue('TriggeredSendExternalKeyForGiftCertificate');
			var externalKey = marketingManager.GetExternalKey(externalKeyJSONString);
			var genericPayload = getGenericPayload(orderDetails);

			for (var index in orderDetails.giftCertificates) {
				var giftCertificate = orderDetails.giftCertificates[index];
				var giftCertificateLineItem = orderDetails.giftCertificateLineItems[index];

				var payload = createGiftCertificateRecipientEmailPayload(genericPayload, giftCertificate, giftCertificateLineItem);
				marketingDataResponse = marketingManager.ExecuteTriggeredSend(externalKey, payload);

				if (marketingDataResponse && !('DeliveryStatus' in marketingDataResponse && marketingDataResponse.DeliveryStatus === 'Error') &&
					'RequestId' in marketingDataResponse && marketingDataResponse.RequestId.length > 0) {
					responseInfo.SuccessfulEmails += payload.RecipientEmail + '; ';
				} else {
					responseInfo.FailedGiftCertificateList.push(giftCertificate);
				}
			}

			logEmailSendResult(responseInfo, marketingDataResponse);
		} else {
			responseInfo.ErrorMessage = 'Gift Certificate via Marketing Cloud is not enabled. No attempt to send the email was made through SFMC.';
		}
	} catch (ex) {
		responseInfo.ErrorMessage = "Unable to successfully send email. Error: " + ex + ".";
	}

	return responseInfo;
}

/* ***** Private Functions ***** */
function getEmptyResponseInfo() {
	return {
		EmailSuccessfullySent: false,
		ErrorMessage: '',
		FailedGiftCertificateList: [],
		SuccessfulEmails: ''
	};
}

function getGenericPayload(orderDetails) {
	return {
		'customerServiceEmail': Site.current.getCustomPreferenceValue('customerServiceEmail') || '',
		'SenderEmail': orderDetails.customerServiceEmail || Site.current.getCustomPreferenceValue('customerServiceEmail')
			|| 'no-reply@example.com',
		'StorefrontUrl': orderDetails.hostName || '',
		'giftCertificateImage': orderDetails.giftCertificateImage || ''
	};
}

/**
 * Creates a payload with Gift Certificate information to send to Marketing Cloud
 * @param {Object} genericPayload consist of sender's email and storefront url
 * @param {Object} giftCertificate gift certificate details
 * @returns {Object} - payload with necessary details for Marketing Cloud
 */
function createGiftCertificateRecipientEmailPayload(genericPayload, giftCertificate, giftCertificateLineItem) {
	var payload = {};

	payload['SenderEmail'] = genericPayload.SenderEmail;
	payload['StorefrontUrl'] = genericPayload.StorefrontUrl;

	payload['RecipientName'] = giftCertificate.recipientName || '';
	payload['RecipientEmail'] = giftCertificate.recipientEmail || '';
	payload['SenderName'] = giftCertificate.senderName || '';
	payload['GiftMessage'] = giftCertificate.message || '';
	payload['GiftAmount'] = giftCertificate.amount || '';
	payload['GiftCertificateCode'] = giftCertificate.giftCertificateCode || '';

	payload['EmailAddress'] = giftCertificate.recipientEmail;
	setSubscriberKey(payload);

	var productLineItemsArray = [{
		'ProductName': giftCertificateLineItem.lineItemText || '',
		'Quantity': '1',
		'Price': giftCertificateLineItem.price.value || '',
		'ProductLink': !empty(genericPayload.StorefrontUrl) ? genericPayload.StorefrontUrl + '/giftcard' : '',
		'productVariants': '',
		'ImageLink': genericPayload.giftCertificateImage || '',
		'isSample': false,
		'PromoCode': '',
		'SKU': 'giftcard',
		'GiftCertificateCode': giftCertificate.giftCertificateCode || ''
	}];

	payload['ProductLineItemsJSON'] = JSON.stringify(productLineItemsArray);

	return payload;
}

function logEmailSendResult(responseInfo, marketingDataResponse) {
	var logger = require('dw/system/Logger');
	// response status, logging all emails successful sent and emails that failed
	if (!!responseInfo.SuccessfulEmails) {
		responseInfo.EmailSuccessfullySent = true;
		logger.info("Successfully sent gift certificate recipient email(s) to '" + responseInfo.SuccessfulEmails + "'.");
	}

	if (responseInfo.FailedGiftCertificateList.length > 0) {
		responseInfo.EmailSuccessfullySent = false;
		responseInfo.ErrorMessage = "Failed to send gift certificate(s) to partial or all emails";

		var failedRecipientList = responseInfo.FailedGiftCertificateList.map(failedCertificate => {
			return {
				"merchantID": failedCertificate.merchantID,
				"recipientEmail": failedCertificate.recipientEmail,
				"orderNo": failedCertificate.orderNo,
			}
		});
		var failedRecipientListString = JSON.stringify(failedRecipientList);
		var errorDescription = marketingDataResponse ? JSON.stringify(marketingDataResponse.ErrorDescription) : '';
		logger.error('Failed to send gift certificate(s) to the following emails: ' + failedRecipientListString +
			' | Error Description: ' + errorDescription);
	}
}

function setSubscriberKey(payload) {
	var serviceManager = require('*/cartridge/scripts/service/ServiceManager');
	var objectNames = require('*/cartridge/scripts/constants/SalesforceConstants').ObjectNames;
	var updateContactIfExists = false;
	var subscriberKey = serviceManager.GetSubscriberKeyFromFullName(payload.EmailAddress, payload.RecipientName, objectNames.Account, updateContactIfExists);
	payload.SubscriberKey = subscriberKey;
}
