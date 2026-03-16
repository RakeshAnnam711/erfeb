/**
*   The purpose of this file is to encapsulate functions for creating the HttpService object
*   for connecting to the Marketing or Service Cloud services (endpoints).
*   Additional generic helper functions around services are also here.
*/

'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('/dw/system/Logger');
var Site = require('dw/system/Site');

let SalesforceConstants = require('*/cartridge/scripts/constants/SalesforceConstants');
let ServiceStringVariables = SalesforceConstants.ServiceStringVariables;
let MarketingCloudEndpoints = SalesforceConstants.MarketingCloudEndpoints;

const ErrorMessagePrefix = 'Service Factory: ';

/* ***** Public Method declarations ***** */
exports.GetService = getService;
exports.GetBaseServiceResponseObject = getBaseServiceResponseObject;
exports.GetErrorDescriptionSuffix = getErrorDescriptionSuffix;

/* ***** Public Functions definitions ***** */
/**
 * Retrieves an HTTP Service setup for the specified cloud and endpoint.
 * NOTE: This function relies on Site Preferences to retrieve and setup services for multiple clouds and endpoints.
* @param {String} cloudName - Required. The name of the cloud to get the HttpService object for; 'MarketingCloud' or 'ServiceCloud'
* @param {String} endpointId - Required. The endpoint to be called. This is needed for building the URL for the service call.
* @returns {dw.svc.HTTPService} - An HTTP Service setup for the specified cloud and endpoint.
*/
function getService(cloudName, endpointId) {
	let cloudNameInMessage =  "Salesforce Cloud: '" + cloudName + "'";
	let serviceInfo = getServiceIdAndEndpoint(cloudName, endpointId, cloudNameInMessage);
	var service = LocalServiceRegistry.createService(serviceInfo.ServiceId, {
		createRequest: function(service, request) {
			// NOTE: The credentials for Marketing & Service Clouds are are handled via Site Preferences.
			// The AuthenticationHelper, which is used by the RequestFactories, is called to get the Access Token,
			// which is then added during the request building process.
			// Additional NOTE: Further changes to the service might be done as part of the request building process,
			// such as adding specific headers such as 'application/x-www-form-urlencoded', as is the case for
			// Service Cloud authentication.

			return request;
		},

		parseResponse: function(service, response) {
			return getResponseInfo(response);
		},

		mockCall: function(service) {
			return getMockResult('');
		},

		filterLogMessage: function(message) {
			return message;
		}
	});

	service.URL = service.URL + serviceInfo.Endpoint;

	if (service.URL.includes(ServiceStringVariables[cloudName + 'TenantSpecificEndpointSubdomain'])) {
		service.URL = service.URL.replace(ServiceStringVariables[cloudName + 'TenantSpecificEndpointSubdomain'], Site.current.getCustomPreferenceValue(cloudName + 'TenantSpecificEndpointSubdomain') || '');
	}

	if (endpointId === MarketingCloudEndpoints.SOAPService) {
		service.addHeader('Content-Type','text/xml');
	}

	return service;
}

/**
 * Returns an empty JSON object setup for a service response with the common attributes.
* @returns {Object} - A base JSON object for a processed service response.
* @example
	The object returned will like this:
	{ Successful: false,
	  ErrorDescription: '' };
*/
function getBaseServiceResponseObject() {
	return {
		Successful: false,
		ErrorDescription: ''
	};
}

/**
 * Returns a string with any code and message information from a service response that
 * can be suffixed to a larger error message.
* @returns {String} - A string containing error code and message information from the service response
* @example
	The string returned might look like this:
	"Code: '401', Short Message: 'Unauthorized', Long Message: 'INVALID_SESSION_ID'."
*/
function getErrorDescriptionSuffix(serviceResponse) {
	return "Code: '" + serviceResponse.error + "', Short Message: '" + serviceResponse.msg + "', Long Message: '" + serviceResponse.errorMessage + "'.";
}


/* ***** Private Functions ***** */
/**
 * Retrieves the identifier or the service (from Business Manager / Administration / Services) to use
 * as well as the value of the endpoint (suffix) that will be added to the service URL.
* @param {String} endpointId - Required. The identifier or an endpoint to look up.
*   The value of this parameter should match the EndpointIds defined in the JSON of the "OtterWebServiceEndpoints-Overrides"
*   site preference. Those are also defined in the "EndpointConstants" file in this cartridge.
* @param {String} cloudNameInMessage - Optional. Used in the error message, if necessary, to help identify which cloud service is being setup.
* @returns {Object} - A JSON object containing the ServiceId, the Endpoint value and whether or not the
*   endpoint has been overridden.
*/
function getServiceIdAndEndpoint(cloudName, endpointId, cloudNameInMessage) {
	let serviceId = getServiceDefinitionId(cloudName, endpointId, cloudNameInMessage);
	let endpoint = getEndpoint(endpointId);

	return {
		ServiceId: serviceId,
		Endpoint: endpoint
	};
}

function getServiceDefinitionId(cloudName, endpointId, cloudNameInMessage) {
	let serviceId = '';
	let supportedCloud = false;

	var salesforceClouds = require('*/cartridge/scripts/constants/SalesforceConstants').SalesforceClouds;
	if (cloudName === salesforceClouds.Marketing) {
		if (endpointId === MarketingCloudEndpoints.Authentication) {
			serviceId = Site.current.getCustomPreferenceValue('MarketingCloudServiceIdForAuthentication');
		} else if (endpointId === MarketingCloudEndpoints.SOAPService) {
			serviceId = Site.current.getCustomPreferenceValue('MarketingCloudServiceIdForSoapApi');
		} else {
			serviceId = Site.current.getCustomPreferenceValue('MarketingCloudServiceIdForRestApi');
		}
		supportedCloud = true;
	} else if (cloudName === salesforceClouds.Service) {
		// NOTE: Service Cloud uses the same base service regardless of authenticating or calling the API
		serviceId = Site.current.getCustomPreferenceValue('ServiceCloudServiceIdForRestApi');
		supportedCloud = true;
	}

	if (!empty(serviceId)) {
		return serviceId;
	} else if (supportedCloud) {
		throw new Error(ErrorMessagePrefix + cloudNameInMessage + ': Site Preference with Service Definition is empty!');
	}

	throw new Error(ErrorMessagePrefix + cloudNameInMessage + ' is unsupported at this time.');
}

function getEndpoint(endpointId) {
	if (endpointId === null || endpointId.length === 0) {
		throw new Error(ErrorMessagePrefix + ' the given endpointId is empty; cannot continue to service creation.');
	}

	let endpoint = Site.current.getCustomPreferenceValue(endpointId);
	if (endpoint === null || endpoint.length === 0) {
		throw new Error(ErrorMessagePrefix + "No value is found for endpointId '" + endpointId + "'; cannot continue to service creation.");
	}

	return endpoint;
}

function getResponseInfo(response) {
	let errorMessage = '';
	let text = '';
	let isValid = false;

	try {
		if (!empty(response.statusCode) && response.statusCode >= 200 && response.statusCode <= 300) {
			if ('text' in response && !empty(response.text)) {
				isValid = true;
				text = response.text;
			} else {
				errorMessage = 'An empty response was returned.';
			}
		} else if (!empty(response.statusCode)) {
			errorMessage = "A statusCode of '" + response.statusCode + "' was returned.";
		} else {
			errorMessage = 'An empty or invalid response was returned and no status code was provided.';
		}
	} catch (ex) {
		errorMessage = 'An unexpected exception occurred :' + ex;
	}

	if (errorMessage.length > 0) { Logger.error(errorMessage); }

	return {
		ErrorMessage: errorMessage,
		IsValid: isValid,
		Text: text
	};
}

function getMockResult(textValue) {
	return {
		statusCode: 200,
		statusMessage: 'OK',
		text: textValue,
		timeout: 30000
	};
}
