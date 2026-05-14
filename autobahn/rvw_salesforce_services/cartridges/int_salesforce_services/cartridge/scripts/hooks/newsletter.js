/* This file implements the hook for the newsletter signup. */
'use strict';

var site = require('dw/system/Site');
var logger = require('dw/system/Logger');

/* ***** Public Method declarations ***** */
if (!!site.current.getCustomPreferenceValue('MarketingCloudForNewsletterEnabled')) {
    exports.subscribe = subscribe;
}

function subscribe(responseData, email, firstName, lastName, source) {
	var resource = require('dw/web/Resource');

	try {
		var contactInfo = getContactInfo(email, firstName, lastName);
		var marketingManager = require('*/cartridge/scripts/marketing/MarketingManager');
		var marketingDataResponse = marketingManager.AddCustomerToNewsletterList(email, contactInfo.SubscriberKey, contactInfo.FirstName, contactInfo.LastName, source);

		var requestIdExists = 'RequestId' in marketingDataResponse && marketingDataResponse.RequestId.length > 0; // Data Extension response
		var eventInstanceIdExists = 'EventInstanceId' in marketingDataResponse && marketingDataResponse.EventInstanceId.length > 0; // Journey response

		marketingDataResponse.ResultMessages = marketingDataResponse.ResultMessages || [];

		if (requestIdExists || eventInstanceIdExists) {
			logger.info(`Successfully added ${email} to the newsletter ${requestIdExists ? 'data extension' : 'journey'}.`);
			marketingDataResponse.ResultMessages.push(resource.msg('form.marketing.subscription.success','forms',null));
		}

		responseData = Object.assign(responseData || {}, {
				success: !!marketingDataResponse.Successful,
				error: !marketingDataResponse.Successful,
				msg: marketingDataResponse.ResultMessages.join()
			});
	} catch (e) {
		logger.error('Adding customer to newsletter list - unexpected exception occurred adding email address {5}. Error: {0}. javaMessage: {1}. fileName: {2}. lineNumber: {3}. stack: {4}', e.toString(), e.javaMessage, e.fileName, e.lineNumber, e.stack, email);
	}
}

function getContactInfo(email, firstName, lastName) {
	var serviceManager = require('*/cartridge/scripts/service/ServiceManager');
	var objectNames = require('*/cartridge/scripts/constants/SalesforceConstants').ObjectNames;
	var updateContactIfExists = false;

	var localFirstName = firstName ? firstName : '';
	var localLastName = lastName ? lastName : '';
	var contactInfo = { "FirstName": localFirstName, "LastName": localLastName, "Email": email };

	var subscriberKey = serviceManager.GetSubscriberKey(contactInfo, objectNames.Account, updateContactIfExists);
	contactInfo.SubscriberKey = subscriberKey;

	return contactInfo;
}
