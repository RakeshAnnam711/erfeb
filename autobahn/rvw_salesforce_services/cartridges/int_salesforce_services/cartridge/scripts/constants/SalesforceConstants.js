'use strict';

/* This file is for constants related to the various Salesforce objects,
   such as Services accessed by this cartridge.
*/

exports.SalesforceClouds = {
	'Marketing': 'MarketingCloud',
	'Service': 'ServiceCloud'
};

exports.CustomObjectTypes = {
	'SalesforceAccessToken': 'SalesforceAccessToken'
};

// Subset of MC Asset IDs
exports.MarketingCloudAssetTypes = {
    eps: 19,
    gif: 20,
    jpe: 21,
    jpeg: 22,
    jpg: 23,
    png: 28,
    svg: 39
};

exports.ServiceStringVariables = {
    MarketingCloudTenantSpecificEndpointSubdomain: '[[MC_ENTERPRISE_SUBDOMAIN_SITEPREF]]',
    ServiceCloudTenantSpecificEndpointSubdomain: '[[SC_ENTERPRISE_SUBDOMAIN_SITEPREF]]'
};

/**
 * The values in this object represent Site Preferences that contain the relative
 * path for an API call. For example, 'MarketingCloudEndpoint-Authentication'
 * will likely have a value of '/v{0}/token'
 */
exports.MarketingCloudEndpoints = {
	'Authentication': 'MarketingCloudEndpoint-Authentication',
	'AddressValidation': 'MarketingCloudEndpoint-Address',
	'DataEvents': 'MarketingCloudEndpoint-DataEvents',
	'DataExtension': 'MarketingCloudEndpoint-DataExtension',
	'Journeys': 'MarketingCloudEndpoint-Journeys',
	'Query': 'MarketingCloudEndpoint-Query',
	'TriggeredSends': 'MarketingCloudEndpoint-TriggeredSends',
    'SOAPService': 'MarketingCloudEndpoint-SOAPService'
};

/**
 * The values in this object represent standard MC soap xml namespaces.
 */
exports.MarketingCloudNamespaces = {
    'SoapENV': new Namespace('soapenv', 'http://schemas.xmlsoap.org/soap/envelope/'),

    'W3Soap': new Namespace('soap', 'http://www.w3.org/2003/05/soap-envelope'),
    'W3XSD': new Namespace('xsd', 'http://www.w3.org/2001/XMLSchema'),
    'W3XSI': new Namespace('xsi', 'http://www.w3.org/2001/XMLSchema-instance'),

    'OOUtility': new Namespace('http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd'),

    'SoapAddressing': new Namespace('addressing', 'http://schemas.xmlsoap.org/ws/2004/08/addressing'),

    'ETToken': new Namespace('','http://exacttarget.com'),
    'ETPartnerAPI': new Namespace('', 'http://exacttarget.com/wsdl/partnerAPI')
};

/**
 * The values in this object represent Site Preferences that contain the relative
 * path for an API call. For example, 'ServiceCloudEndpoint-Authentication'
 * will likely have a value of '/services/oauth2/token'
 */
exports.ServiceCloudEndpoints = {
	'Authentication': 'ServiceCloudEndpoint-Authentication',
	'Query': 'ServiceCloudEndpoint-Query',
	'SalesforceObject': 'ServiceCloudEndpoint-SObject'
};

/**
 * The values in this object represent the types of actions that can be executed
 * against Salesforce Standard and Custom objects.
 */
exports.ObjectActionDescriptions = {
	'Create': 'creating',
	'Read': 'reading',
	'Update': 'updating',
	'Delete': 'deleting'
};

/**
 * The values in this object the types of objects that can be executed against.
 * This is not meant to be a comprehensive list of all Salesforce Standard objects
 * and will obviously not contain the names of Custom objects.
 * This is primarily provided as a safer means of working with common objects
 * and avoiding string literals and misspellings.
 */
exports.ObjectNames = {
	"Account": "Account",
	"Case": "Case",
	"Contact": "Contact",
	"Lead": "Lead"
};
