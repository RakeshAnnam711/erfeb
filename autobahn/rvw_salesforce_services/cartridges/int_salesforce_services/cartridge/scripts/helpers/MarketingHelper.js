/*  This class/file contains helper functions that are used by the infrastructure for calling
 *  SFMC as well as other callers that may need information about SFMC properties,
 *  such as the AccountId (MID).
*/
'use strict'

var base = module.superModule;

/* ***** Public Method declarations ***** */
exports.GetAccountId = getAccountId;

/* ***** Public Functions definitions ***** */
/**
* Retrieves the credential information from Site Preferences for authenticating against Marketing Cloud.
* @returns {Object} - A JSON object with the credentials to be used for authenticating to Marketing Cloud.
*/
function getAccountId() {
	var site = require('dw/system/Site');
	let accountIdString = site.current.getCustomPreferenceValue('MarketingCloudAccountId');
	var errorMessage = 'The string in the MarketingCloudAccountId site preference is empty; cannot continue to create authentication request for Marketing Cloud.';
	if (!empty(accountIdString)) {
		var accountId = '';
		var accountJson = null;
		try {
			accountJson = JSON.parse(accountIdString);
			// JSON.parse will succeed when passed a number. In a non-multi brand configuration
			// this will be the case; the accountId string will be something like '5430948322'.
			// Check added for if it is actually an object, otherwise throw to get into the catch and set the accountId
			if (accountJson === null || typeof accountJson !== 'object') {
				throw "The retrieved SFMC Account Id of '" + accountIdString + "' is not JSON Object.";
			}
		} catch (ex) {
			accountId = accountIdString
		}

		if (empty(accountId) && accountJson !== null) {
			try {
				var localSession = session;
				var brandId = localSession.sourceCodeInfo && localSession.sourceCodeInfo.code ? localSession.sourceCodeInfo.code : accountIdString;
				for (var index = 0; index < accountJson.length; index++) {
					if (accountJson[index].BrandId === brandId) {
						accountId = accountJson[index].MID;
						break;
					}
				}
			} catch (ex) {
				errorMessage = 'Error looking up the Marketing Cloud Account Id in the JSON object parsed from the MarketingCloudAccountId site preference; cannot continue to create authentication request for Marketing Cloud: ' + ex;
			}
		}

		return accountId;
	}

	throw new Error(errorMessage);
}

module.exports = exports;
