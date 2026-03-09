/* This class encapsulates working with Custom Objects. */

'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');

exports.GetCustomObjectIfExists = getCustomObjectIfExists;
exports.GetOrCreateCustomObject = getOrCreateCustomObject;

/* Public Methods */
/**
 * Will Get a Custom Object of the given type and Id if it exists or return null if it does not.
 * NOTE: A custom object cannot be created from a storefront request. That is why this method is
 * here, as well as the following "getOrCreateCustomObject" function.
* @param {String} customObjectType - Required. The custom object type. See the CustomObjectTypes object in "scripts/constants/SalesforceConstants"
* @param {String} id - Required. The identifier of the custom object.
* @returns {Object} - A JSON object in the format returned from Salesforce.
*/
function getCustomObjectIfExists(customObjectType, id) {
	return getCustomObject(customObjectType, id);
}

/**
 * Will Get or Create a Custom Object of the given type and Id.
* @param {String} customObjectType - Required. The custom object type. See the CustomObjectTypes object in "scripts/constants/SalesforceConstants"
* @param {String} id - Required. The identifier of the custom object.
* @returns {Object} - A JSON object in the format returned from Salesforce.
*/
function getOrCreateCustomObject(customObjectType, id) {
	var customObject = getCustomObject(customObjectType, id);
	if (customObject !== null) {
		return customObject;
	}

	return createCustomObject(customObjectType, id);
}

/* ***** Private Functions ***** */
function getCustomObject(customObjectType, id) {
	return CustomObjectMgr.getCustomObject(customObjectType, id);
}

function createCustomObject(customObjectType, id) {
	var Transaction = require('dw/system/Transaction');
	Transaction.begin();
	var customObject = CustomObjectMgr.createCustomObject(customObjectType, id);
	Transaction.commit();

	return customObject;
}
