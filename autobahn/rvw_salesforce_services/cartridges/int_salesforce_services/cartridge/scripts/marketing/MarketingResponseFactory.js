/**
*   The purpose of this file is to encapsulate functions for processing responses for the different
*   Salesforce Marketing Cloud API services (endpoints).
*   Some responses, such as for Authentication, might need to be be modified into a common format
*   (used by Service Cloud as well) or for easier consumption in Commerce Cloud.
*   Other responses may just return the given JSON in the response as that JSON object.
*/

var Calendar = require('dw/util/Calendar');
var Site = require('dw/system/Site');

var ServiceFactory = require('*/cartridge/scripts/ServiceFactory');

'use strict';

/* ***** Public Method declarations ***** */
exports.ProcessAuthenticationTokenResponse = processAuthenticationTokenResponse;
exports.ProcessGenericRestResponse = processGenericRestResponse;
exports.ProcessGenericSoapResponse = processGenericSoapResponse;
exports.ProcessInsertIntoDataExtensionResponse = processInsertIntoDataExtensionResponse;
exports.ProcessFireJourneyEventResponse = processFireJourneyEventResponse;
exports.ProcessTriggeredSendResponse = processTriggeredSendResponse;
exports.ProcessDeliveryDetailsResponse = processDeliveryDetailsResponse;
exports.ProcessSubscriptionSubscriberListResponse = processSubscriptionSubscriberListResponse;
exports.ProcessAllListResponse = processAllListResponse;
exports.ProcessEmailFromSubscriberIdResponse = processEmailFromSubscriberIdResponse;

/* ***** Public Functions definitions ***** */
/**
 * Processes the authentication data from Service Cloud into the AccessToken information
 * returned as a JSON from this function.
* @param {Object} serviceResponse - Required. The response from the service call to Salesforce.
* @returns {Object} - A JSON object with authentication information; AccessToken, InstanceUrl, Expiration
* @example
	The object returned will like this:
	{ AccessToken: '',
	  ExpirationDateTime: '',
	  ExpiresIn: 9999,
	  InstanceUrl: '' };
*/
function processAuthenticationTokenResponse(serviceResponse) {
	var authenticationHelper = require('*/cartridge/scripts/AuthenticationHelper');
	let authenticationResponse = authenticationHelper.GetEmptyAuthenticationResponseObject();
	let serviceResponseObject = serviceResponse.object && serviceResponse.object.Text ? JSON.parse(serviceResponse.object.Text) : null;
	if (serviceResponseObject) {
		authenticationResponse.AccessToken = serviceResponseObject.access_token;
		authenticationResponse.ExpiresIn = serviceResponseObject.expires_in;
		authenticationResponse.InstanceUrl = serviceResponseObject.rest_instance_url;

		// NOTE: Marketing Cloud returns a token expiration (Service Cloud does not)
		if (authenticationResponse.ExpiresIn) {
			let calendarDate = new Calendar(new Date());
			calendarDate.add(Calendar.SECOND, authenticationResponse.ExpiresIn);
			authenticationResponse.ExpirationDateTime = calendarDate.time;
		}
	}

	return authenticationResponse;
}

/**
 * Capable of processing any response from Marketing Cloud; returns the data in the same JSON format
 * that was sent from Salesforce in the SalesforceInfo property.
 * NOTE: This function can be used to process numerous different kinds of queries to Salesforce.
* @param {Object} serviceResponse - Required. The response from the service call to Salesforce.
* @returns {Object} - A JSON object in the format returned from Salesforce.
*/
function processGenericRestResponse(serviceResponse) {
	let processedResponse = ServiceFactory.GetBaseServiceResponseObject();
	if ('object' in serviceResponse && serviceResponse.object !== null && serviceResponse.object.Text.length > 0) {
		processedResponse.SalesforceInfo = JSON.parse(serviceResponse.object.Text);
		processedResponse.Successful = true;
	} else {
		processedResponse.SalesforceInfo = null;
		let errorDescriptionSuffix = ServiceFactory.GetErrorDescriptionSuffix(serviceResponse);
		processedResponse.ErrorDescription = 'Response from Marketing Cloud did not return a complete response: ' + errorDescriptionSuffix;
	}

	return processedResponse;
}

/**
 * Capable of processing any response from Marketing Cloud; returns the data in the same JSON format
 * that was sent from Salesforce in the SalesforceInfo property.
 * NOTE: This function can be used to process numerous different kinds of queries to Salesforce.
* @param {Object} serviceResponse - Required. The response from the service call to Salesforce.
* @returns {Object} - A JSON object in the format returned from Salesforce.
*/
function processGenericSoapResponse(serviceResponse) {
	let processedResponse = ServiceFactory.GetBaseServiceResponseObject();

	let Reader = require('dw/io/Reader');
	let XMLSoapHelper = require('*/cartridge/scripts/util/XMLSoapHelper');

	if ('object' in serviceResponse && serviceResponse.object !== null && serviceResponse.object.Text.length > 0) {
		try {
			var StringReader = new Reader(serviceResponse.object.Text);
			var xmlObject = XMLSoapHelper.ReaderToJSON(StringReader);

			let envelope = xmlObject.find(function (node) { return node.name === 'Envelope'; });
			let body = (envelope && envelope.elements || []).find(function (node) { return node.name === 'Body'; });
			let retrieveResp = (body && body.elements || []).find(function (node) { return node.name === 'RetrieveResponseMsg'; });

			processedResponse = retrieveResp.elements || [];
		} catch (err) {
			processedResponse.SalesforceInfo = null;
			let errorDescriptionSuffix = ServiceFactory.GetErrorDescriptionSuffix(serviceResponse);
			processedResponse.ErrorDescription = 'Response from Marketing Cloud did not return a complete response: ' + errorDescriptionSuffix;
		}
	} else {
		processedResponse.SalesforceInfo = null;
		let errorDescriptionSuffix = ServiceFactory.GetErrorDescriptionSuffix(serviceResponse);
		processedResponse.ErrorDescription = 'Response from Marketing Cloud did not return a complete response: ' + errorDescriptionSuffix;
	}

	return processedResponse;
}

/**
 * Processes the response when inserting data into a Marketing Cloud Data Extension.
* @param {Object} serviceResponse - Required. The response from the service call to Salesforce.
* @returns {Object} - A JSON object in the format returned from Salesforce.
*/
function processInsertIntoDataExtensionResponse(serviceResponse) {
	let processedResponse = ServiceFactory.GetBaseServiceResponseObject();
	if ('object' in serviceResponse && serviceResponse.object !== null && serviceResponse.object.Text.length > 0) {
		let insertInfo = JSON.parse(serviceResponse.object.Text);
		processedResponse.RequestId = insertInfo.requestId;
		processedResponse.ResultMessages = insertInfo.resultMessages;
		let foundError = false;
		for (let index = 0; index < insertInfo.resultMessages.length; index++) {
			let resultMessage = insertInfo.resultMessages[index];
			if (resultMessage.resultClass === 'Error') {
				foundError = true;
			}
		}

		processedResponse.Successful = foundError === false ? true : false;
	}
	else {
		processedResponse.RequestId = '';
		processedResponse.ResultMessages = [];
		let errorDescriptionSuffix = ServiceFactory.GetErrorDescriptionSuffix(serviceResponse);
		processedResponse.ErrorDescription = 'Response from Marketing Cloud for inserting into a Data Extension did not execute as expected: ' + errorDescriptionSuffix;
	}

	return processedResponse;
}

/**
 * Processes the response when firing a Marketing Cloud Journey Event.
* @param {Object} serviceResponse - Required. The response from the service call to Salesforce.
* @returns {Object} - A JSON object in the format returned from Salesforce.
*/
function processFireJourneyEventResponse(serviceResponse) {
	let processedResponse = ServiceFactory.GetBaseServiceResponseObject();
	if ('object' in serviceResponse && serviceResponse.object !== null && serviceResponse.object.Text.length > 0) {
		let responseInfo = JSON.parse(serviceResponse.object.Text);
		processedResponse.EventInstanceId = responseInfo.eventInstanceId;
		processedResponse.Successful = true;
	} else {
		processedResponse.EventInstanceId = null;
		let errorDescriptionSuffix = ServiceFactory.GetErrorDescriptionSuffix(serviceResponse);
		processedResponse.ErrorDescription = 'Response from Marketing Cloud did not return a complete response: ' + errorDescriptionSuffix;
	}

	return processedResponse;
}

/**
 * Processes the response when executing a Triggered Send in Marketing Cloud.
* @param {Object} serviceResponse - Required. The response from the service call to Salesforce.
* @returns {Object} - A JSON object in the format returned from Salesforce.
*/
function processTriggeredSendResponse(serviceResponse) {
	var processedResponse = ServiceFactory.GetBaseServiceResponseObject();
	if ('object' in serviceResponse && serviceResponse.object !== null && serviceResponse.object.Text.length > 0) {
		var triggeredSendInfo = JSON.parse(serviceResponse.object.Text);
		processedResponse.RequestId = triggeredSendInfo.requestId;
		processedResponse.Responses = triggeredSendInfo.responses;
		var foundError = false;
		var recipientSendId = '';
		for (let index = 0; index < triggeredSendInfo.responses.length; index++) {
			var sendResponse = triggeredSendInfo.responses[index];
			if (sendResponse.hasErrors) {
				foundError = true;
			}
			recipientSendId = sendResponse.recipientSendId;
		}
		processedResponse.RecipientSendId = recipientSendId;
		processedResponse.Successful = foundError === false ? true : false;
	}
	else {
		processedResponse.RequestId = '';
		processedResponse.RecipientSendId = '';
		processedResponse.Responses = [];
		let errorDescriptionSuffix = ServiceFactory.GetErrorDescriptionSuffix(serviceResponse);
		processedResponse.ErrorDescription = 'Response from Marketing Cloud for executing a Triggered Send did not respond as expected: ' + errorDescriptionSuffix;
	}

	return processedResponse;
}

/**
 * Processes the response for checking Delivery Details of an email (triggered) send in Marketing Cloud.
* @param {Object} serviceResponse - Required. The response from the service call to Salesforce.
* @returns {Object} - A JSON object in the format returned from Salesforce.
*/
function processDeliveryDetailsResponse(serviceResponse) {
	let processedResponse = ServiceFactory.GetBaseServiceResponseObject();
	if ('object' in serviceResponse && serviceResponse.object !== null && serviceResponse.object.Text.length > 0) {
		var deliveryInfo = JSON.parse(serviceResponse.object.Text);
		processedResponse.RequestId = deliveryInfo.id;
		processedResponse.RecipientSendId = deliveryInfo.messageId;
		processedResponse.Status = deliveryInfo.status;
		var foundError = false;
		if (deliveryInfo.status === 'Error') {
			foundError = true;
		}

		if (deliveryInfo.status === 'Sent') {
			processedResponse.DeliveryTime = deliveryInfo.deliveryTime;
		} else {
			processedResponse.DeliveryTime = '';
		}

		var errorMessages = '';
		if ('messageErrors' in deliveryInfo) {
			for (var index = 0; index < deliveryInfo.messageErrors.length; index++) {
				let messageError = deliveryInfo.messageErrors[index];
				if (errorMessages.length > 0) {
					errorMessages += ', ';
				}
				if ('messageErrorStatus' in messageError && !empty(messageError.messageErrorStatus)) {
					errorMessages += messageError.messageErrorStatus;
				}
			}
		}

		if (!empty(errorMessages)) {
			processedResponse.ErrorDescription = errorMessages;
		}

		if (foundError && empty(errorMessages)) {
			processedResponse.ErrorDescription = "SendRecipientId of '" + deliveryInfo.messageId + "' returned an error status, but no detailed error messages.";
		}
		processedResponse.Successful = foundError === false ? true : false;
	}
	else {
		processedResponse.RequestId = '';
		processedResponse.RecipientSendId = '';
		processedResponse.Status = 'Unknown';
		let errorDescriptionSuffix = ServiceFactory.GetErrorDescriptionSuffix(serviceResponse);
		processedResponse.ErrorDescription = 'Response from Marketing Cloud for checking delivery details did not return as expected: ' + errorDescriptionSuffix;
	}

	return processedResponse;
}

/**
 * Capable of processing any response from Marketing Cloud; returns the data in the same JSON format
 * that was sent from Salesforce in the SalesforceInfo property.
 * NOTE: This function can be used to process numerous different kinds of queries to Salesforce.
* @param {Object} serviceResponse - Required. The response from the service call to Salesforce.
* @returns {Object} - A JSON object in the format returned from Salesforce.
*/
function processSubscriptionSubscriberListResponse(serviceResponse) {
	let processedResponse = ServiceFactory.GetBaseServiceResponseObject();

	let Reader = require('dw/io/Reader');
	let XMLSoapHelper = require('*/cartridge/scripts/util/XMLSoapHelper');

	if ('object' in serviceResponse && serviceResponse.object !== null && serviceResponse.object.Text.length > 0) {
		try {
			var StringReader = new Reader(serviceResponse.object.Text);
			var xmlObject = XMLSoapHelper.ReaderToJSON(StringReader);

			let envelope = xmlObject.find(function (node) { return node.name === 'Envelope'; });
			let body = (envelope && envelope.elements || []).find(function (node) { return node.name === 'Body'; });
			let updateResp = (body && body.elements || []).find(function (node) { return node.name === 'UpdateResponse' || node.name === 'RetrieveResponseMsg'; });
			let createResp = (body && body.elements || []).find(function (node) { return node.name === 'CreateResponse' || node.name === 'RetrieveResponseMsg'; });
			let overallStatus;
			let results;
			if (!empty(updateResp)) {
				overallStatus = (updateResp && updateResp.elements || []).find(function (node) { return node.name === 'OverallStatus'; });
				results = (updateResp && updateResp.elements || []).filter(function (node) { return node.name === 'Results'; });
			} else {
				overallStatus = (createResp && createResp.elements || []).find(function (node) { return node.name === 'OverallStatus'; });
				results = (createResp && createResp.elements || []).filter(function (node) { return node.name === 'Results'; });
			}

			var responseObj = {
				xmlJSON: updateResp ? updateResp : createResp,
				status: (overallStatus || {}).text,
				results: results.map(function (result) {
					var list = {
						type: result.attributes && result.attributes.type,
					};

					(result.elements || []).forEach(function (prop) {
						if (prop.name && !(prop.name in list)) {
							list.properties = list.properties || {};
							list.properties[prop.name] = prop.text;
						} else {
							throw 'SOAP Response for Result type ListSubscribe already exists in mapped json.';
						}
					});

					return list;
				})
			};

			processedResponse = responseObj;

		} catch (err) {
			processedResponse.SalesforceInfo = null;
			let errorDescriptionSuffix = ServiceFactory.GetErrorDescriptionSuffix(serviceResponse);
			processedResponse.ErrorDescription = 'Response from Marketing Cloud did not return a complete response: ' + errorDescriptionSuffix;
		}
	} else {
		processedResponse.SalesforceInfo = null;
		let errorDescriptionSuffix = ServiceFactory.GetErrorDescriptionSuffix(serviceResponse);
		processedResponse.ErrorDescription = 'Response from Marketing Cloud did not return a complete response: ' + errorDescriptionSuffix;
	}

	return processedResponse;
}

/**
 * Capable of processing any response from Marketing Cloud; returns the data in the same JSON format
 * that was sent from Salesforce in the SalesforceInfo property.
 * NOTE: This function can be used to process numerous different kinds of queries to Salesforce.
* @param {Object} serviceResponse - Required. The response from the service call to Salesforce.
* @returns {Object} - A JSON object in the format returned from Salesforce.
*/
function processAllListResponse(serviceResponse) {
	let processedResponse = ServiceFactory.GetBaseServiceResponseObject();

	let Reader = require('dw/io/Reader');
	let XMLSoapHelper = require('*/cartridge/scripts/util/XMLSoapHelper');

	if ('object' in serviceResponse && serviceResponse.object !== null && serviceResponse.object.Text.length > 0) {
		try {
			var StringReader = new Reader(serviceResponse.object.Text);
			var xmlObject = XMLSoapHelper.ReaderToJSON(StringReader);

			let envelope = xmlObject.find(function (node) { return node.name === 'Envelope'; });
			let body = (envelope && envelope.elements || []).find(function (node) { return node.name === 'Body'; });
			let retrieveResp = (body && body.elements || []).find(function (node) { return node.name === 'RetrieveResponseMsg'; });
			let overallStatus = (retrieveResp && retrieveResp.elements || []).find(function (node) { return node.name === 'OverallStatus'; });

			let results = (retrieveResp && retrieveResp.elements || []).filter(function (node) { return node.name === 'Results'; });

			var responseObj = {
				xmlJSON: retrieveResp,
				status: (overallStatus || {}).text,
				results: results.map(function (result) {
					var list = { type: result.attributes && result.attributes.type };

					(result.elements || []).forEach(function (prop) {
						if (prop.name && !(prop.name in list)) {
							list[prop.name] = prop.text;
						} else {
							throw 'SOAP Response for Result type List already exists in mapped json.';
						}
					});

					return list;
				})
			};

			processedResponse = responseObj;

		} catch (err) {
			processedResponse.SalesforceInfo = null;
			let errorDescriptionSuffix = ServiceFactory.GetErrorDescriptionSuffix(serviceResponse);
			processedResponse.ErrorDescription = 'Response from Marketing Cloud did not return a complete response: ' + errorDescriptionSuffix;
		}
	} else {
		processedResponse.SalesforceInfo = null;
		let errorDescriptionSuffix = ServiceFactory.GetErrorDescriptionSuffix(serviceResponse);
		processedResponse.ErrorDescription = 'Response from Marketing Cloud did not return a complete response: ' + errorDescriptionSuffix;
	}

	return processedResponse;
}

/**
 * Capable of processing Subscriber responses from Marketing Cloud; returns the data in the same JSON format
 * that was sent from Salesforce in the SalesforceInfo property.
 * NOTE: This function should be used to get an email address out of a Subscriber object response.
* @param {Object} serviceResponse - Required. The response from the service call to Salesforce.
* @returns {Object} - A JSON object in the format returned from Salesforce.
*/
function processEmailFromSubscriberIdResponse(serviceResponse) {
	let processedResponse = ServiceFactory.GetBaseServiceResponseObject();

	let Reader = require('dw/io/Reader');
	let XMLSoapHelper = require('*/cartridge/scripts/util/XMLSoapHelper');

	if ('object' in serviceResponse && serviceResponse.object !== null && serviceResponse.object.Text.length > 0) {
		try {
			var StringReader = new Reader(serviceResponse.object.Text);
			var xmlObject = XMLSoapHelper.ReaderToJSON(StringReader);

			let envelope = xmlObject.find(function (node) { return node.name === 'Envelope'; });
			let body = (envelope && envelope.elements || []).find(function (node) { return node.name === 'Body'; });
			let retrieveResp = (body && body.elements || []).find(function (node) { return node.name === 'RetrieveResponseMsg'; });
			let overallStatus = (retrieveResp && retrieveResp.elements || []).find(function (node) { return node.name === 'OverallStatus'; });

			let results = (retrieveResp && retrieveResp.elements || []).filter(function (node) { return node.name === 'Results'; });

			var responseObj = {
				xmlJSON: retrieveResp,
				status: (overallStatus || {}).text,
				email: results.map(function (result) {
					let email = null;
					(result.elements || []).forEach(function (prop) {
						if (prop.name === 'EmailAddress') {
							email = prop.text;
						}
					});

					return email;
				})[0]
			};

			processedResponse = responseObj;

		} catch (err) {
			processedResponse.SalesforceInfo = null;
			let errorDescriptionSuffix = ServiceFactory.GetErrorDescriptionSuffix(serviceResponse);
			processedResponse.ErrorDescription = 'Response from Marketing Cloud did not return a complete response: ' + errorDescriptionSuffix;
		}
	} else {
		processedResponse.SalesforceInfo = null;
		let errorDescriptionSuffix = ServiceFactory.GetErrorDescriptionSuffix(serviceResponse);
		processedResponse.ErrorDescription = 'Response from Marketing Cloud did not return a complete response: ' + errorDescriptionSuffix;
	}

	return processedResponse;
}

/* ***** Private Functions ***** */
