/**
*   The purpose of this file is to encapsulate functions related to authenticating against
*   Salesforce Marketing & Service Clouds.
*   Because each cloud does authentication differently and has varying responses, this file
*   normalizes the authentication process across clouds.
*/

var Transaction = require('dw/system/Transaction');

'use strict';

/* ***** Public Method declarations ***** */
exports.GetAccessTokenInfo = getAccessTokenInfo;
exports.NewTokenNeeded = newTokenNeeded;
exports.GetEmptyAuthenticationResponseObject = getEmptyAuthenticationResponseObject;

/* ***** Public Functions definitions ***** */
/**
 * Retrieves the AccessToken information from the SalesforceAccessToken custom object OR by calling the
 * appropriate service for the cloud being accessed.
* @param {String} cloudName - Required. The identifier of the Salesforce cloud working with. See the SalesforceClouds object in "scripts/constants/SalesforceConstants"
* @returns {Object} - A JSON object with authentication information; AccessToken, InstanceUrl, Expiration
* @example
	The object returned will like this:
	{ AccessToken: '',
	  ExpirationDateTime: '',
	  ExpiresIn: 9999,
	  InstanceUrl: '' };
*/
function getAccessTokenInfo(cloudName) {
	let tokenInfo = getTokenInfoFromCustomObject(cloudName);
	if (empty(tokenInfo.AccessToken)) {
		var serviceFactory = require('*/cartridge/scripts/ServiceFactory');

		var salesforceClouds = require('*/cartridge/scripts/constants/SalesforceConstants').SalesforceClouds;
		if (cloudName === salesforceClouds.Marketing) {
			var marketingCloudEndpoints = require('*/cartridge/scripts/constants/SalesforceConstants').MarketingCloudEndpoints;
			let authenticationService = serviceFactory.GetService(cloudName, marketingCloudEndpoints.Authentication);
			var marketingRequestFactory = require('*/cartridge/scripts/marketing/MarketingRequestFactory');
			let marketingRequest = marketingRequestFactory.GetAuthenticationTokenRequest();
			let marketingResponse = authenticationService.call(JSON.stringify(marketingRequest));
			var marketingResponseFactory = require('*/cartridge/scripts/marketing/MarketingResponseFactory');
			tokenInfo = marketingResponseFactory.ProcessAuthenticationTokenResponse(marketingResponse);
		} else if (cloudName === salesforceClouds.Service) {
			var serviceCloudEndpoints = require('*/cartridge/scripts/constants/SalesforceConstants').ServiceCloudEndpoints;
			let authenticationService = serviceFactory.GetService(cloudName, serviceCloudEndpoints.Authentication);
			var serviceRequestFactory = require('*/cartridge/scripts/service/ServiceRequestFactory');
			let serviceRequest = serviceRequestFactory.GetAuthenticationTokenRequest(authenticationService);
			let serviceResponse = authenticationService.call(serviceRequest);
			var serviceResponseFactory = require('*/cartridge/scripts/service/ServiceResponseFactory');
			tokenInfo = serviceResponseFactory.ProcessAuthenticationTokenResponse(serviceResponse);
		}

		let accessTokenObject = getAccessTokenObject(cloudName);
		Transaction.begin();
		accessTokenObject.custom.AccessToken = tokenInfo.AccessToken;
		accessTokenObject.custom.InstanceUrl = tokenInfo.InstanceUrl;
		if (tokenInfo.ExpirationDateTime !== null && tokenInfo.ExpirationDateTime !== '') {
			accessTokenObject.custom.ExpirationDateTime = tokenInfo.ExpirationDateTime;
		}
		Transaction.commit();
	}

	return tokenInfo;
}

/**
 * Inspects the response returned from a Salesforce service to determine if a new AccessToken is needed.
 * NOTE: Marketing Cloud returns a general HTTP 401 error code, Unauthorized. Service Cloud does that and
 * also includes an invalid session message/code.
* @param {String} cloudName - Required. The identifier of the Salesforce cloud working with. See the SalesforceClouds object in "scripts/constants/SalesforceConstants"
* @param {Result} serviceResponse - Required.
* @returns {Boolean} - True if a new token is needed, false if not.
*/
function newTokenNeeded(cloudName, serviceResponse) {
	var Reader = require('dw/io/Reader');
	var XMLSoapHelper = require('*/cartridge/scripts/util/XMLSoapHelper');
	var error = {};

	// SOAP Error Response
	try {
		var StringReader = new Reader(serviceResponse.errorMessage);
		var xmlObject = XMLSoapHelper.ReaderToJSON(StringReader);
	} catch (err) {
		// Reader may not be able to parse String, may not be XML
	}

	if (!empty(xmlObject) && Array.isArray(xmlObject)) {
		let envelope = xmlObject.find(function (node) { return node.name === 'Envelope'; });
		let body = (envelope && envelope.elements || []).find(function (node) { return node.name === 'Body'; });
		let fault = (body && body.elements || []).find(function (node) { return node.name === 'Fault'; });

		let code = (fault && fault.elements || []).find(function (node) { return node.name === 'Code'; });
		let reason = (fault && fault.elements || []).find(function (node) { return node.name === 'Reason'; });
		let node = (fault && fault.elements || []).find(function (node) { return node.name === 'Node'; });

		error.code = ((code && code.elements || []).find(function (node) { return node.name === 'Value'; }) || {}).text;
		error.reason = ((reason && reason.elements || []).find(function (node) { return node.name === 'Text'; }) || {}).text;
		error.node = (node || {}).text;
	}

	// Both Marketing and Service Clouds return a 401, Error, Unauthorized when the token has expired
    // Added a check for Marketing Cloud's SOAP login failed '500' error.
	if ('status' in serviceResponse && serviceResponse.status === 'ERROR' &&
		(responseIsUnauthorized(serviceResponse, error) || responseIsLoginFailed(serviceResponse, error))) {
		let needReset = false;

		// However, Service Cloud also includes an invalid session Id in the errorMessage
		var salesforceClouds = require('*/cartridge/scripts/constants/SalesforceConstants').SalesforceClouds;
		if (cloudName === salesforceClouds.Service) {
			if ('errorMessage' in serviceResponse && serviceResponse.errorMessage.indexOf('INVALID_SESSION_ID') > -1) {
				needReset = true;
			}
		} else if (cloudName === salesforceClouds.Marketing) {
			needReset = true;
		}

		if (needReset) {
			let accessTokenObject = getAccessTokenObject(cloudName);
			resetAccessToken(accessTokenObject);
			return true;
		}
	}

	return false;
}

function responseIsUnauthorized(serviceResponse, error) {
    if (('error' in serviceResponse && serviceResponse.error === 401 || !empty(error.code)) &&
        ('msg' in serviceResponse && serviceResponse.msg === 'Unauthorized' || error.reason === 'Token Expired')) {
            return true;
    }

    return false;
}

function responseIsLoginFailed(serviceResponse, error) {
    if (('error' in serviceResponse && serviceResponse.error === 500 || !empty(error.code)) &&
        error.reason === 'Login Failed') {
            return true;
    }

    return false;
}

/**
 * Returns an empty JSON object setup for Authentication information.
* @returns {Object} - A JSON object with authentication information; AccessToken, InstanceUrl, Expiration
* @example
	The object returned will like this:
	{ AccessToken: '',
	  ExpirationDateTime: '',
	  ExpiresIn: 9999,
	  InstanceUrl: '' };
*/
function getEmptyAuthenticationResponseObject() {
	return {
		AccessToken: '',
		ExpirationDateTime: '',
		ExpiresIn: 9999,
		InstanceUrl: ''
	};
}

/* ***** Private Functions ***** */
function getTokenInfoFromCustomObject(cloudName) {
	let tokenInfo = getEmptyAuthenticationResponseObject();
	let accessTokenObject = getAccessTokenObject(cloudName);
	if (accessTokenObject === null) {
		throw new Error("Could not retrieve or create a custom object for the token for cloud '" + cloudName + "'; cannot continue.");
	}

	if (accessTokenObject && 'AccessToken' in accessTokenObject.custom && !empty(accessTokenObject.custom.AccessToken)) {
		// NOTE: The expiration of Access Tokens in Service Cloud is both configurable, as well as rolling,
		// meaning that as long as the service (and token) is used within the time period, it will continue to be valid.
		// As of fall 2021, Reverie has their session timeout set to 12 hours.
		// Since the Expiration is not returned from Service Cloud and because the expiration length can be altered
		// outside of Commerce Cloud, it is not recorded in the custom object.
		// If and when a token for either cloud expires, a new token will be requested.
		let expired = false;
		if ('ExpirationDateTime' in accessTokenObject.custom && accessTokenObject.custom.ExpirationDateTime !== null) {
			var calendar = require('dw/util/Calendar');
			let nowCalendarDate = new calendar(new Date());
			let tokenCalendarDate = new calendar(accessTokenObject.custom.ExpirationDateTime);
			if (nowCalendarDate.compareTo(tokenCalendarDate) > 0) {
				expired = true;
			}
		}

		if (expired) {
			resetAccessToken(accessTokenObject);
		}

		tokenInfo.AccessToken = accessTokenObject.custom.AccessToken;
		tokenInfo.InstanceUrl = accessTokenObject.custom.InstanceUrl;
		tokenInfo.ExpirationDateTime = accessTokenObject.custom.ExpirationDateTime;
	}

	return tokenInfo;
}

function getAccessTokenObject(cloudName) {
	var customObjectHelper = require('*/cartridge/scripts/util/CustomObjectHelper');
	var customObjectTypes = require('*/cartridge/scripts/constants/SalesforceConstants').CustomObjectTypes;
	var salesforceClouds = require('*/cartridge/scripts/constants/SalesforceConstants').SalesforceClouds;

	let accessTokenObject = null;
	if (cloudName === salesforceClouds.Marketing) {
		var marketingHelper = require('*/cartridge/scripts/helpers/MarketingHelper');
		var accountId = marketingHelper.GetAccountId();
		var accessTokenId = salesforceClouds.Marketing + '-' + accountId;
		accessTokenObject = customObjectHelper.GetOrCreateCustomObject(customObjectTypes.SalesforceAccessToken, accessTokenId);
	} else if (cloudName === salesforceClouds.Service) {
		accessTokenObject = customObjectHelper.GetOrCreateCustomObject(customObjectTypes.SalesforceAccessToken, salesforceClouds.Service);
	}

	return accessTokenObject;
}

function resetAccessToken(accessTokenObject) {
	Transaction.begin();
	accessTokenObject.custom.AccessToken = '';
	accessTokenObject.custom.ExpirationDateTime = null;
	accessTokenObject.custom.InstanceUrl = '';
	Transaction.commit();
}
