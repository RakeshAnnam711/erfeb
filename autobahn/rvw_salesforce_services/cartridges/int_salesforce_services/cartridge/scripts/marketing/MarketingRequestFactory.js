/**
*   The purpose of this file is to encapsulate functions for creating the requests for the different
*   Marketing Cloud API services (endpoints).
*
*   All of the request building functions handle adding the Access Token to the request via a header.
*   If the token is missing or expired, this will require an additional call to the service that the
*   caller to build the request will not see.
*
*   All of the request building functions will also alter the URL to have the appropriate version number
*   (set in Site Preferences).
*
*   NOTE: Some of the requests will need to do additional alterations the given HttpService (adding other headers).
*/

var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');

var SalesforceConstants = require('*/cartridge/scripts/constants/SalesforceConstants');
var XMLSoapHelper = require('*/cartridge/scripts/util/XMLSoapHelper')

'use strict';

/* ***** Public Method declarations ***** */
exports.GetAuthenticationTokenRequest = getAuthenticationTokenRequest;
exports.GetValidateEmailAddressRequest = getValidateEmailAddressRequest;
exports.GetQueryContentAssetByIdRequest = getQueryContentAssetByIdRequest;
exports.GetInsertContentAssetRequest = getInsertContentAssetRequest;
exports.GetInsertIntoDataEventsRequest = getInsertIntoDataEventsRequest;
exports.GetInsertIntoDataExtensionRequest = getInsertIntoDataExtensionRequest;
exports.GetExecuteTriggeredSendRequest = getExecuteTriggeredSendRequest;
exports.GetDeliveryDetailsRequest = getDeliveryDetailsRequest;
exports.GetFireJourneyEventRequest = getFireJourneyEventRequest;
exports.GetSoapRequest = getSoapRequest;
exports.GetSoapRetreieveRequest = getSoapRetreieveRequest;
exports.GetSoapUpdateRequest = getSoapUpdateRequest;
exports.GetSubscriptionSubscriberListRequest = getSubscriptionSubscriberListRequest;
exports.UpdateSubscriptionSubscriberListsRequest = updateSubscriptionSubscriberListsRequest;
exports.GetAllListRequest = getAllListRequest;
exports.GetEmailFromSubscriberIdRequest = getEmailFromSubscriberIdRequest;

/* ***** Public Functions definitions ***** */
/**
* Retrieves the credential information from Site Preferences for authenticating against Marketing Cloud.
* @returns {Object} - A JSON object with the credentials to be used for authenticating to Marketing Cloud.
*/
function getAuthenticationTokenRequest() {
	var marketingHelper = require('*/cartridge/scripts/helpers/MarketingHelper');
	let clientId = Site.current.getCustomPreferenceValue('MarketingCloudClientId');
	let clientSecret = Site.current.getCustomPreferenceValue('MarketingCloudClientSecret');
	let accountId = marketingHelper.GetAccountId();

	return {
		'grant_type': 'client_credentials',
		'client_id': clientId,
		'client_secret': clientSecret,
		'account_id': accountId
	};
}

/**
 * Updates the service object and creates the request to validate an email address by Marketing Cloud.
* @param {String} emailAddress - Required. The email address to validate
* @param {Object} marketingService - Required. The HttpService object that will be called.
* @returns {Object} - A JSON object in the format needed by Salesforce.
*/
function getValidateEmailAddressRequest(emailAddress, marketingService) {
	let accessTokenInfo = getAccessTokenInfo();
	addAuthorizationHeader(marketingService, accessTokenInfo);
	let updatedUrl = updateVersionInUrl(marketingService.URL);
	marketingService.URL = updatedUrl;

	return {
		"email": emailAddress,
		"validators": [
			"SyntaxValidator",
			"MXValidator",
			"ListDetectiveValidator"
		]
	};
}

/**
 * Updates the given instance of the MarketingService to query for Content Assets.
 * For this SFMC API call, there is no JSON (request) object that goes in the body of the call,
 * instead, the URL contains all the data needed for the lookup (assetId).
 * @param {String} assetId - Required/Optional. The ID of a content asset in Marketing Cloud to query for. For example, "32647"
 * @param {String} assetFilter - Optional/Required. The filter for content assets in Marketing Cloud; e.g. "CustomerKey eq 'brand_logo_desktop'"
 * @param {Object} marketingService - Required. The HttpService object that will be called.
 * @returns {Boolean} - True if the URL on the HttpService object was successfully updated for
 * querying for a content asset.
 * @example
	Before calling this function, the URL on the HttpService address object will look something like this:
	https://mcz7rh6w0pl2bf9gj8k6493r-5h4.rest.marketingcloudapis.com/asset/v1/content/assets
	After, like this:
	https://mcz7rh6w0pl2bf9gj8k6493r-5h4.rest.marketingcloudapis.com/asset/v1/content/assets/32647
*/
function getQueryContentAssetByIdRequest(assetId, assetFilter, marketingService) {
	let accessTokenInfo = getAccessTokenInfo();
	addAuthorizationHeader(marketingService, accessTokenInfo);
	let updatedUrl = updateVersionInUrl(marketingService.URL);

	if (!empty(assetId)) {
		updatedUrl += '/' + assetId;
	} else if (!empty(assetFilter)) {
		updatedUrl += (updatedUrl.indexOf('?') === -1 ? '?' : '&') + '$filter=' + encodeURIComponent(assetFilter);
	}

	marketingService.URL = updatedUrl;
	marketingService.setRequestMethod('GET');

	return true;
}

/**
 * Updates the given instance of the MarketingService to insert for Content Assets.
 * JSON (request) object that goes in the body of the call,
 * instead, the URL contains all the data needed for the lookup (assetId).
 * @param {String} assetId - Optional. The ID of a content asset in Marketing Cloud to query for. For example, "32647". Required for patch update.
 * @param {Object} assetData - Required. The object definition of a content asset in Marketing Cloud to create.
 * @param {Object} marketingService - Required. The HttpService object that will be called.
 * @returns {Object} - A JSON object representing the request that can be passed to Marketing Cloud.
*/
function getInsertContentAssetRequest(assetId, assetData, marketingService) {
	let accessTokenInfo = getAccessTokenInfo();
	addAuthorizationHeader(marketingService, accessTokenInfo);
	let updatedUrl = updateVersionInUrl(marketingService.URL);

	// Change post to patch
	if (!empty(assetId)) {
		updatedUrl += '/' + assetId;

		marketingService.setRequestMethod('PATCH');
	}

	marketingService.URL = updatedUrl;

	return assetData;
}

/**
 * This function will both update the given instance of the MarketingService to insert into a Data Events as well as
 * return the request object that will be passed in the body.
 * @param {String} externalKey - Required. The External Key (not the name) of the Data Event to insert row(s) into
 * @param {Array} arrayOfItems - Required. The items to be inserted into the Data Events. This must be an array of JSON objects.
 * @param {Object} marketingService - Required. The HttpService object that will be called.
 * @returns {Object} - A JSON object representing the request that can be passed to Marketing Cloud.
 * @example
	TODO: Add example of the arrayOfItems that goes here.
*/
function getInsertIntoDataEventsRequest(externalKey, arrayOfItems, marketingService) {
	let accessTokenInfo = getAccessTokenInfo();
	addAuthorizationHeader(marketingService, accessTokenInfo);
	let updatedUrl = updateVersionInUrl(marketingService.URL + '/key:' + externalKey + '/rowset');
	marketingService.URL = updatedUrl;

	let requestBody = arrayOfItems;

	return requestBody;
}

/**
 * This function will both update the given instance of the MarketingService to insert into a Data Extension as well as
 * return the request object that will be passed in the body.
 * @param {String} externalKey - Required. The External Key (not the name) of the Data Extension to insert row(s) into
 * @param {Array} arrayOfItems - Required. The items to be inserted into the Data Extension. This must be an array of JSON objects.
 * Each property of the object should be the name of a field in the Data Extension and the data should be in the proper format.
 * @param {Object} marketingService - Required. The HttpService object that will be called.
 * @returns {Object} - A JSON object representing the request that can be passed to Marketing Cloud.
  * @example
	If the Data Extension has 4 fields; SubscriberKey, EmailAddress, FirstName & LastName, and one item is being added,
	the given array should look like this:
	[{SubscriberKey: "test-user@some-domain.com", EmailAddress: "test-user@some-domain.com", FirstName: "Test", LastName: "User"}]

	URL Changes
	Before calling this function, the URL on the HttpService address object will look something like this:
	https://mcz7rh6w0pl2bf9gj8k6493r-5h4.rest.marketingcloudapis.com/data/v1/async/dataextensions
	After, like this:
	https://mcz7rh6w0pl2bf9gj8k6493r-5h4.rest.marketingcloudapis.com/data/v1/async/dataextensions/key:CommerceCloudAccountsExtension/rows
*/
function getInsertIntoDataExtensionRequest(externalKey, arrayOfItems, marketingService) {
	let accessTokenInfo = getAccessTokenInfo();
	addAuthorizationHeader(marketingService, accessTokenInfo);
	let updatedUrl = updateVersionInUrl(marketingService.URL + '/key:' + externalKey + '/rows');
	marketingService.URL = updatedUrl;

	let requestBody = {
		items: arrayOfItems
	};

	return requestBody;
}

/**
 * This function will both update the given instance of the MarketingService to execute a Triggered Send as well as
 * return the request object that will be passed in the body.
 * @param {String} externalKey - Required. The External Key (not the name) of the Triggered Send to send the data to
 * @param {Array} extensionData - Required. The data to be sent to the Triggered Send. Note, this must include SubscriberKey and EmailAddress properties.
 * It should also include a property in the object should that is the name of each field in the Data Extension used by the Triggered Send.
 * @param {Object} marketingService - Required. The HttpService object that will be called.
 * @returns {Object} - A JSON object representing the request that can be passed to Marketing Cloud.
 * @example
	If the Data Extension used by the Triggered send has 4 fields; SubscriberKey, EmailAddress, FirstName & LastName,
	the given JSON object should look like this:
	{SubscriberKey: "test-user@some-domain.com", EmailAddress: "test-user@some-domain.com", FirstName: "Test", LastName: "User"}
*/
function getExecuteTriggeredSendRequest(externalKey, extensionData, marketingService) {
	let accessTokenInfo = getAccessTokenInfo();
	addAuthorizationHeader(marketingService, accessTokenInfo);
	let updatedUrl = updateVersionInUrl(marketingService.URL + '/key:' + externalKey + '/send');
	marketingService.URL = updatedUrl;

	if ('SubscriberKey' in extensionData && !empty(extensionData.SubscriberKey) &&
		'EmailAddress' in extensionData && !empty(extensionData.EmailAddress)) {
		return {
			"To": {
				"Address": extensionData.EmailAddress,
				"SubscriberKey": extensionData.SubscriberKey,
				"ContactAttributes": {
					"SubscriberAttributes": extensionData
				}
			}
		};
	}

	return null;
}

/**
 * This function will both update the given instance of the MarketingService to execute a Triggered Send as well as
 * return the request object that will be passed in the body.
 * @param {String} externalKey - Required. The External Key (not the name) of the Triggered Send to send the data to
 * @param {String} recipientSendId - Required. The recipientSendId returned in the response from the email (triggered) send.
 * @param {Object} marketingService - Required. The HttpService object that will be called.
 * @returns {Object} - A JSON object representing the request that can be passed to Marketing Cloud.
 * @example
	This call to SFMC is an HTTP GET where the URL is altered.
	It will look something like this:
	https://...rest.marketingcloudapis.com/messaging/v1/messageDefinitionSends/key:My_External_Key/deliveryRecords/41b07874-b496-4289-869b-0f65d6e94556
*/
function getDeliveryDetailsRequest(externalKey, recipientSendId, marketingService) {
	let accessTokenInfo = getAccessTokenInfo();
	addAuthorizationHeader(marketingService, accessTokenInfo);
	let updatedUrl = updateVersionInUrl(marketingService.URL + '/key:' + externalKey + '/deliveryRecords/' + recipientSendId);
	marketingService.URL = updatedUrl;
	marketingService.setRequestMethod('GET');

	return true;
}

/**
 * This function will both update the given instance of the MarketingService to execute a Triggered Send as well as
 * return the request object that will be passed in the body.
 * @param {String} eventDefinitionKey - Required. The Event Definition Key (not the name) of the API Event that begins a Journey
 * @param {Array} journeyData - Required. The data to be sent to the Journey. Note, this must include SubscriberKey and EmailAddress properties.
 * It should also include a property in the object should that is the name of each field in the Data Extension used by the API Event.
 * @param {Object} marketingService - Required. The HttpService object that will be called.
 * @param {String} contactKey - Optional. The Contact Key of the individual to associate with the event for Journey.
 * The Contact Key is often the same as the SubscriberKey (email address), but can be unique id of a Contact.
 * If no value is provided, the SubscriberKey in the journeyData will be used for the ContactKey.

 * @returns {Object} - A JSON object representing the request that can be passed to Marketing Cloud.
 * @example
	If the Data Extension used by the API Event has 4 fields; SubscriberKey, EmailAddress, FirstName & LastName,
	the given JSON object should look like this:
	{SubscriberKey: "test-user@some-domain.com", EmailAddress: "test-user@some-domain.com", FirstName: "Test", LastName: "User"}
*/
function getFireJourneyEventRequest(eventDefinitionKey, journeyData, marketingService, contactKey) {
	let accessTokenInfo = getAccessTokenInfo();
	addAuthorizationHeader(marketingService, accessTokenInfo);
	let updatedUrl = updateVersionInUrl(marketingService.URL + '/events');
	marketingService.URL = updatedUrl;

	if ('SubscriberKey' in journeyData && !empty(journeyData.SubscriberKey) &&
		'EmailAddress' in journeyData && !empty(journeyData.EmailAddress)) {
		let localContactKey = contactKey || journeyData.SubscriberKey;
		return {
			"ContactKey": localContactKey,
			"EventDefinitionKey": eventDefinitionKey,
			"Data": journeyData
		};
	}

	return null;
}

/* ***** Private Functions ***** */
function getAccessTokenInfo() {
	var authenticationHelper = require('*/cartridge/scripts/AuthenticationHelper');
	var salesforceClouds = SalesforceConstants.SalesforceClouds;
	return authenticationHelper.GetAccessTokenInfo(salesforceClouds.Marketing);
}

function addAuthorizationHeader(marketingService, action, requestBody) {
	var marketingCloudNamespaces = SalesforceConstants.MarketingCloudNamespaces;
	var accessTokenInfo = getAccessTokenInfo();

	if (marketingService.configuration.ID === Site.current.getCustomPreferenceValue('MarketingCloudServiceIdForSoapApi')) {
		var header = XMLSoapHelper.SetNode(<Header/>, marketingCloudNamespaces.SoapENV);
		var action = XMLSoapHelper.SetNode(<Action mustUnderstand="1">{action || ''}</Action>, marketingCloudNamespaces.SoapAddressing);
		var to = XMLSoapHelper.SetNode(<To mustUnderstand="1">{marketingService.URL}</To>, marketingCloudNamespaces.SoapAddressing);
		var oauth = XMLSoapHelper.SetNode(<fueloauth>{accessTokenInfo.AccessToken}</fueloauth>, marketingCloudNamespaces.ETToken);
		// Set namespace for attribute
		action.@mustUnderstand.setNamespace(marketingCloudNamespaces.SoapENV);
		to.@mustUnderstand.setNamespace(marketingCloudNamespaces.SoapENV);
		header.appendChild(action);
		header.appendChild(to);
		header.appendChild(oauth);
		requestBody.appendChild(header);
	} else {
		marketingService.addHeader('Authorization', 'Bearer ' + accessTokenInfo.AccessToken);
	}
}

function updateVersionInUrl(url) {
	let version = Site.current.getCustomPreferenceValue('MarketingCloudVersion');
	return StringUtils.format(url, version);
}

function getSoapRequest(marketingSOAPService, action, bodyContentXML) {
	var marketingCloudNamespaces = SalesforceConstants.MarketingCloudNamespaces;

	var envelope = XMLSoapHelper.SetNode(<Envelope/>, marketingCloudNamespaces.SoapENV, [marketingCloudNamespaces.SoapAddressing, marketingCloudNamespaces.OOUtility]);
	addAuthorizationHeader(marketingSOAPService, action, envelope);

	var body = XMLSoapHelper.SetNode(<Body/>, marketingCloudNamespaces.SoapENV); //, [marketingCloudNamespaces.W3XSI, marketingCloudNamespaces.W3XSD]);
	body.appendChild(bodyContentXML);

	envelope.appendChild(body);

	return envelope;
}

function getSoapRetreieveRequest(marketingSOAPService, retrieveReqValues) {
	var marketingCloudNamespaces = SalesforceConstants.MarketingCloudNamespaces;
	var marketingHelper = require('*/cartridge/scripts/helpers/MarketingHelper');

	var retrieveReqMsg = XMLSoapHelper.SetNode(<RetrieveRequestMsg/>, marketingCloudNamespaces.ETPartnerAPI);
	var retrieveRequest = <RetrieveRequest/>;

	retrieveRequest.appendChild(<ClientIDs><ClientID>{marketingHelper.GetAccountId()}</ClientID></ClientIDs>);
	retrieveRequest.appendChild(<ObjectType>{retrieveReqValues.ObjectType}</ObjectType>);

	retrieveReqValues.Properties.forEach(function (Property) {
		retrieveRequest.appendChild(<Properties>{Property}</Properties>);
	});

	retrieveReqValues.Filters.forEach(function (Filter) {
		var filterNode = XMLSoapHelper.SetNode(<Filter type="ns1:SimpleFilterPart"/>, null, [new Namespace('ns1', marketingCloudNamespaces.ETPartnerAPI.uri)]);
		// Set namespace for attribute
		filterNode.@type.setNamespace(marketingCloudNamespaces.W3XSI);

		(Object.keys(Filter) || []).forEach(function (nodeName) {
			var node = new XML();
			node.setLocalName(nodeName);

			filterNode.appendChild(node);
			filterNode[nodeName] = Filter[nodeName];
		});

		// Build full Body
		retrieveRequest.appendChild(filterNode);
	});

	retrieveReqMsg.appendChild(retrieveRequest);

	return exports.GetSoapRequest(marketingSOAPService, 'Retrieve', retrieveReqMsg);
}

function getSoapUpdateRequest(marketingSOAPService, updateObject, objectType, createRequest) {
	var marketingCloudNamespaces = SalesforceConstants.MarketingCloudNamespaces;

	var recursiveSetProperties = function (objectNode, updateSubObject) {
		Object.keys(updateSubObject || {}).forEach(function (propertyName) {
			var value = updateSubObject[propertyName];

			if (['boolean','number'].indexOf(typeof value) !== -1) value = value.toString();

			if (empty(value) || typeof value === 'string') {
				var node = new XML( empty(value) ? <node nil='true'/> : <node/>);
				node.setLocalName(propertyName);

				if(empty(value)) {
					node.@nil.setNamespace(marketingCloudNamespaces.W3XSI);
				}

				//Append first then set value
				objectNode.appendChild(node);
				if (typeof value === 'string') {
					objectNode[propertyName] = value;
				}
			} else {
				if (typeof value === 'object') {
					if (Array.isArray(value)) {
						value.forEach(function (arrValue) {
							var multiNode = new XML(<node/>);
							multiNode.setLocalName(propertyName);
							recursiveSetProperties(multiNode, arrValue);

							objectNode.appendChild(multiNode);
						});
					} else {
						var node = new XML(<node/>);
						node.setLocalName(propertyName);

						//Add Children first then append
						recursiveSetProperties(node, value);

						objectNode.appendChild(node);
					}
				}
			}
		});
	}
	var reqMsg = '';
	if (createRequest) {
		reqMsg = XMLSoapHelper.SetNode(<CreateRequest/>, marketingCloudNamespaces.ETPartnerAPI);
	} else {
		reqMsg = XMLSoapHelper.SetNode(<UpdateRequest/>, marketingCloudNamespaces.ETPartnerAPI);
	}
	var objectNode = <Objects/>;
	// Set attribute namespace
	objectNode.@type = objectType;
	objectNode.@type.setNamespace(marketingCloudNamespaces.W3XSI);

	// Add Object childern
	recursiveSetProperties(objectNode, updateObject);

	reqMsg.appendChild(objectNode);

	return exports.GetSoapRequest(marketingSOAPService, 'Update', reqMsg);
}

function getSubscriptionSubscriberListRequest(subscriberKey, marketingSOAPService) {
	var retrieveReqValues = {
		ObjectType: 'ListSubscriber',
		Properties: ['SubscriberKey','ID','ListID','Status'],
		Filters: [
			{
				Property: 'SubscriberKey',
				SimpleOperator: 'equals',
				Value: subscriberKey
			}
		]
	};

	return exports.GetSoapRetreieveRequest(marketingSOAPService, retrieveReqValues);
}

function getAllListRequest(marketingSOAPService) {
	var retrieveReqValues = {
		ObjectType: 'List',
		Properties: ['ListName','ID','CreatedDate','Description','ListClassification','Type'],
		Filters: [
			{
				Property: 'ListClassification',
				SimpleOperator: 'equals',
				Value: 'PublicationList'
			}
		]
	};

	return exports.GetSoapRetreieveRequest(marketingSOAPService, retrieveReqValues);
}

function updateSubscriptionSubscriberListsRequest(subscriberObject, listArray, marketingSOAPService, createRequest) {
	var subscriberObject = {
		PartnerKey: null,
		ObjectID: null,
		SubscriberKey: subscriberObject.SubscriberKey,
		EmailAddress: subscriberObject.EmailAddress,
		Lists: listArray
	};

	return exports.GetSoapUpdateRequest(marketingSOAPService, subscriberObject, 'Subscriber', createRequest);
}

function getEmailFromSubscriberIdRequest(subscriberId, marketingSOAPService) {
	var retrieveReqValues = {
		ObjectType: 'Subscriber',
		Properties: ['SubscriberKey','EmailAddress','ID','Status'],
		Filters: [
			{
				Property: 'ID',
				SimpleOperator: 'equals',
				Value: subscriberId
			}
		]
	};

	return exports.GetSoapRetreieveRequest(marketingSOAPService, retrieveReqValues);
}