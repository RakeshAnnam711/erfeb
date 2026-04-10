/**
*   The purpose of this file is to encapsulate functions for creating the requests for the different
*   Service Cloud API services (endpoints).
*
*   All of the request building functions handle adding the Access Token to the request via a header.
*   If the token is missing or expired, this will require an additional call to the service that the
*   caller to build the request will not see.
*
*   All of the request building functions will also alter the URL to have the appropriate version number
*   (set in Site Preferences) and use the base url that is returned from the Service Cloud Authentication service.
*
*   NOTE: Some of the requests will need to do additional alterations the given HttpService (adding other headers).
*/

var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');

'use strict';

/* ***** Public Method declarations ***** */
exports.GetAuthenticationTokenRequest = getAuthenticationTokenRequest;
exports.GetQueryRequest = getQueryRequest;
exports.GetObjectRequest = getObjectRequest;

/* ***** Public Functions definitions ***** */
/**
 * Retrieves the credential information from Site Preferences for authenticating against Service Cloud.
* @param {Object} serviceCloud - Required. The HttpService object that will be called.
* @returns {String} - An 'x-www-form-urlencoded' encoded string to be used for authenticating to Service Cloud.
* @example
	The string returned will look something like this (altered to not contain sensitive data):
	"grant_type=password&client_id=3MVG98R.....CtNvH&client_secret=77AAAEB07.....92D173&username=serviceAccount@reverie.com.comcloud&password=9ab.....4vdWl";
*/
function getAuthenticationTokenRequest(serviceCloud) {
	let clientId = Site.current.getCustomPreferenceValue('ServiceCloudConsumerKey');
	let clientSecret = Site.current.getCustomPreferenceValue('ServiceCloudConsumerSecret');
	let userName = Site.current.getCustomPreferenceValue('ServiceCloudUserName');
	let password = Site.current.getCustomPreferenceValue('ServiceCloudPassword');
	let securityToken = Site.current.getCustomPreferenceValue('ServiceCloudSecurityToken');
	let combinedPassword = encodeURIComponent(password) + securityToken;

	serviceCloud.addHeader('Content-Type', 'application/x-www-form-urlencoded');
	return "grant_type=password&client_id=" + clientId + "&client_secret=" + clientSecret + "&username=" + encodeURIComponent(userName) + "&password=" + combinedPassword;

	// NOTE: Service Cloud doesn't want a JSON request for authentication like Marketing Cloud does,
	// so putting JSON like this in the body of the call will not work:
	//return {
	//	'grant_type': 'password',
	//	'client_id': clientId,
	//	'client_secret': clientSecret,
	//	'username': userName,
	//	'password': combinedPassword
	//};
}

/**
 * Processes the query data from Service Cloud and returns it in the same JSON format
 * that was sent from Salesforce.
 * NOTE: This function can be used to process numerous different kinds of queries to Salesforce.
* @param {String} query - Required. The query to be executed. The ServiceManager should have formatted the query for the caller.
* @param {Object} serviceCloud - Required. The HttpService object that will be called.
* @param {String} endpointId - Required. The endpoint to be called. This is needed for building the URL for the service call.
* @returns {Boolean} - True if all went well and the service is ready to call. No request is passed for this call;
* it is a GET method with all the information in the URL.
*/
function getQueryRequest(query, serviceCloud, endpointId) {
	let accessTokenInfo = getAccessTokenInfo();
	addAuthorizationHeader(serviceCloud, accessTokenInfo);
	let updatedUrl = '';
	if (!empty(accessTokenInfo.InstanceUrl)) {
		let endpoint = Site.current.getCustomPreferenceValue(endpointId);
		updatedUrl = updateVersionInUrl(accessTokenInfo.InstanceUrl + endpoint + '/?q=' + query);
	} else {
		updatedUrl = updateVersionInUrl(serviceCloud.URL + '/?q=' + query);
	}
	serviceCloud.URL = updatedUrl;
	serviceCloud.setRequestMethod('GET');

	return true;
}

/**
* This function will setup the service for multiple kinds of actions against any standard or custom object
* by updating the given HttpService object to be ready to execute again the given Salesforce object.
 * NOTE: This function is not creating a request object for the body of the call; it is updating the URL and HTTP Headers as needed depending on what action is being executed.
* @param {String} objectName - Required. The name of the object that will be executed against. Example values are; "Account", "Case", "Contact" and "Lead"
* @param {Object} serviceCloud - Required. The HttpService object that will be called.
* @param {String} endpointId - Required. The endpoint to be called. This is needed for building the URL for the service call.
* @param {String} actionDescription - Optional. The action that will be executed against the given Salesforce Object. Example values are; "Create", "Read", "Update" and "Delete".
* @param {String} objectKey - Optional. Only needed for non-create actions when a key for an existing object is necessary in order to update or delete.
* If not provided, then it is assumed a POST call (Create) will be made with this request.
* @returns {Boolean} - True if the URL on the HttpService object was successfully updated for executing against the object.
*/
function getObjectRequest(objectName, serviceCloud, endpointId, jsonData, actionDescription, objectKey) {
	let accessTokenInfo = getAccessTokenInfo();
	addAuthorizationHeader(serviceCloud, accessTokenInfo);
	serviceCloud.addHeader('Content-Type', 'application/json');
	let updatedUrl = '';
	if (!empty(accessTokenInfo.InstanceUrl)) {
		let endpoint = Site.current.getCustomPreferenceValue(endpointId);
		updatedUrl = updateVersionInUrl(accessTokenInfo.InstanceUrl + endpoint + '/' + objectName);
	} else {
		updatedUrl = updateVersionInUrl(serviceCloud.URL + '/' + objectName);
	}

	var objectActionDescriptions = require('*/cartridge/scripts/constants/SalesforceConstants').ObjectActionDescriptions;
	if (actionDescription !== null) {
		// NOTE: Additional checks will be added here to support other actions such as Read (GET), Update (PATCH) & Delete (DELETE)
		// Create (POST) is the default behavior
		if (actionDescription === objectActionDescriptions.Delete || actionDescription === objectActionDescriptions.Update) {
			addObjectKeyToUrl(updatedUrl, objectKey);
		}
		if (actionDescription === objectActionDescriptions.Delete) {
			serviceCloud.setRequestMethod('DELETE');
		} else if (actionDescription === objectActionDescriptions.Update) {
			serviceCloud.setRequestMethod('PATCH');
		}
	}

	serviceCloud.URL = updatedUrl;

	return true;
}

/* ***** Private Functions ***** */
function getAccessTokenInfo() {
	var authenticationHelper = require('*/cartridge/scripts/AuthenticationHelper');
	var salesforceClouds = require('*/cartridge/scripts/constants/SalesforceConstants').SalesforceClouds;
	return authenticationHelper.GetAccessTokenInfo(salesforceClouds.Service);
}

function addAuthorizationHeader(serviceCloud, accessTokenInfo) {
	serviceCloud.addHeader('Authorization', 'Bearer ' + accessTokenInfo.AccessToken);
}

function updateVersionInUrl(url) {
	let version = Site.current.getCustomPreferenceValue('ServiceCloudVersion');
	return StringUtils.format(url, version);
}

function addObjectKeyToUrl(url, objectKey) {
	return url +'/' + objectKey;
}
