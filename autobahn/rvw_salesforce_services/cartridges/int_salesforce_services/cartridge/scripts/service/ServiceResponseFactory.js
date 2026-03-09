/**
*   The purpose of this file is to encapsulate functions for processing responses for the different
*   Salesforce Service Cloud API services (endpoints).
*   Some responses, such as for Authentication, might need to be be modified into a common format
*   (used by Marketing Cloud as well) or for easier consumption in Commerce Cloud.
*   Other responses may just return the given JSON in the response as that JSON object.
*/

var Calendar = require('dw/util/Calendar');
var Site = require('dw/system/Site');

var ServiceFactory = require('*/cartridge/scripts/ServiceFactory');

'use strict';

/* ***** Public Method declarations ***** */
exports.ProcessAuthenticationTokenResponse = processAuthenticationTokenResponse;
exports.ProcessGenericResponse = processGenericResponse;
exports.ProcessObjectResponse = processObjectResponse;


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
	if (serviceResponse && 'object' in serviceResponse && serviceResponse.object && !empty(serviceResponse.object.Text)) {
		let serviceResponseObject = JSON.parse(serviceResponse.object.Text);
		authenticationResponse.AccessToken = serviceResponseObject.access_token;
		authenticationResponse.InstanceUrl = serviceResponseObject.instance_url;
	} else {
		var logger = require('dw/system/Logger');
		logger.error("Expected data not found in authentication response from Service Cloud.");
	}

	// NOTE: The ExpirationDateTime is not set here as it's not part of the
	// response from Service Cloud. It is also a configurable value, as well
	// the token will stay active if kept in use.

	return authenticationResponse;
}

/**
 * Capable of processing any response from Service Cloud; returns the data in the same JSON format
 * that was sent from Salesforce in the SalesforceInfo property.
 * NOTE: This function can be used to process numerous different kinds of API calls to Salesforce.
* @param {Object} serviceResponse - Required. The response from the service call to Salesforce.
* @returns {Object} - A JSON object in the format returned from Salesforce.
*/
function processGenericResponse(serviceResponse) {
	let processedResponse = ServiceFactory.GetBaseServiceResponseObject();
	if ('object' in serviceResponse && serviceResponse.object !== null && serviceResponse.object.Text.length > 0) {
		processedResponse.SalesforceInfo = JSON.parse(serviceResponse.object.Text);
		processedResponse.Successful = true;
	}
	else {
		processedResponse.SalesforceInfo = null;
		let errorDescriptionSuffix = ServiceFactory.GetErrorDescriptionSuffix(serviceResponse);
		processedResponse.ErrorDescription = 'Response from Service Cloud did not return a complete response: ' + errorDescriptionSuffix;
	}

	return processedResponse;
}

/**
 * Processes the data returned from Service Cloud when executing an action against a Salesforce Object and returns the data in the same JSON format
 * that was sent from Salesforce.
 * NOTE: This function can be used to process numerous different kinds of actions against all standard and custom Salesforce objects.
* @param {Object} serviceResponse - Required. The response from the service call to Salesforce.
* @param {String} objectName - Optional. The name of the object that was executed against to produce the given serviceResponse; used in the error description if necessary.
* @param {String} actionDescription - Optional. The action that was executed to produce the given serviceResponse; used in the error description if necessary.
* @returns {Object} - A JSON object in the format returned from Salesforce.
*/
function processObjectResponse(serviceResponse, objectName, actionDescription) {
	let processedResponse = ServiceFactory.GetBaseServiceResponseObject();
	if ('object' in serviceResponse && serviceResponse.object !== null && serviceResponse.object.Text.length > 0) {
		let objectInfo = JSON.parse(serviceResponse.object.Text);
		processedResponse.Successful = objectInfo.success;
		processedResponse.Id = objectInfo.id;
		processedResponse.ErrorMessages = objectInfo.errors;
	}
	else {
		processedResponse.Id = '';
		processedResponse.ErrorMessages = [];
		let errorDescriptionSuffix = ServiceFactory.GetErrorDescriptionSuffix(serviceResponse);
		processedResponse.ErrorDescription = 'Response from Service Cloud for ' + actionDescription + ' in object ' + objectName + ' did not execute as expected: ' + errorDescriptionSuffix;
	}

	return processedResponse;
}
/* ***** Private Functions ***** */
