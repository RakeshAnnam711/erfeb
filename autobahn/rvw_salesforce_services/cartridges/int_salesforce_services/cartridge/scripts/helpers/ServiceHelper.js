/*  This class/file contains helper functions that are primarily used by other files/classes
	in this cartridge for actions such as adding/retrieving ContactInfo from the Session.
*/

'use strict'

/* ***** Public Method declarations ***** */
exports.AddContactInfoToSession = addContactInfoToSession;
exports.GetContactIdFromSession = getContactIdFromSession;
exports.GetContactInfoFromSession = getContactInfoFromSession;
exports.RemoveContactInfoFromSession = removeContactInfoFromSession;
exports.UpdateContactInfoForSavingToPersonAccount = updateContactInfoForSavingToPersonAccount;

/* ***** Public Functions definitions ***** */
/**
  * Part of the automation that this salesforce services cartridge does, if the Site Preference
 * "MarketingCloudUseContactIdForSubscriberKey" is enabled, is to call into Service Cloud to get
 * a (customer) contact's Id so that that Id can be passed to Marketing Cloud as the "Subscriber Key".
 * In order to reduce calls to Service Cloud to retrieve the contactId, after it is retrieved the
 * first time, it is stored in a custom session array for contact info.
 *
 * This function is for adding contact information to the custom session variable.
 * This is typically called after an attempt to look up a contact in the session variable was not successful,
 * Service Cloud was called, now add the contact info to the session.
 * @param {Object} contactInfo : A JSON object containing information about a customer contact.
 * The JSON object should have, at a minimum, the basic information on a contact:
 * { "FirstName": "Hank", "LastName": "McHankerson", "Email": "hank+4@mailinator.com" }
 * @param {*} contactId : The unique identifier for a contact that was returned from Service Cloud
 */
function addContactInfoToSession(contactInfo, contactId) {
	var contactInfoList = [];
	if (Object.hasOwnProperty.call(session.custom, 'ContactInfoList') && !empty(session.custom.ContactInfoList)) {
		contactInfoList = JSON.parse(session.custom.ContactInfoList);
	}

	contactInfo["id"] = contactId;
	contactInfoList.push(contactInfo);
	session.custom.ContactInfoList = JSON.stringify(contactInfoList);
}

/**
 * Part of the automation that this salesforce services cartridge does, if the Site Preference
 * "MarketingCloudUseContactIdForSubscriberKey" is enabled, is to call into Service Cloud to get
 * a (customer) contact's Id so that that Id can be passed to Marketing Cloud as the "Subscriber Key".
 * In order to reduce calls to Service Cloud to retrieve the contactId, after it is retrieved the
 * first time, it is stored in a custom session array for contact info.
 *
 * This function is for retrieving contactId for the given contactInfo from that custom session variable
 * so that it can then be used in a payload (request) that is sent to Marketing Cloud
 * @param {Object} contactInfo : A JSON object containing information about a customer contact.
 * The JSON object should have, at a minimum, the basic information on a contact:
 * { "FirstName": "Hank", "LastName": "McHankerson", "Email": "hank+4@mailinator.com" }
 * @returns {String} The id of the contact or null if it is not found in the session.
 */
function getContactIdFromSession(contactInfo) {
	if (Object.hasOwnProperty.call(session.custom, 'ContactInfoList') && !empty(session.custom.ContactInfoList)) {
		var contactInfoList = JSON.parse(session.custom.ContactInfoList);

		var existingContactInfo = contactInfoList.find(function (contactInfoFromSession) {
			return  contactInfoFromSession.Email === contactInfo.Email &&
					contactInfoFromSession.FirstName === contactInfo.FirstName &&
					contactInfoFromSession.LastName === contactInfo.LastName;
		});

		if (existingContactInfo && existingContactInfo.id) {
			return existingContactInfo.id;
		}
	}

	return null;
}

/**
 * This function is for retrieving a contactInfo from a custom session variable, either for the given email address
 * or the first contactInfo found in the list.
 * 99% of the time, the first entry in the custom session variable info will be the customer currently browsing the site.
 * This function is used by the CollectHelper to get user data to push to SFMC.
 * @param {String} email : A customer's email address.
 * @param {Boolean} returnFirstContactIfNotFound : If true, a contactInfo is not found by email (or not looked up) and
 * there is at least 1 contactInfo, then the first one will be returned.
 * @returns {Object} A contactInfo object that is stored in the session or null.
 */
function getContactInfoFromSession(email, returnFirstContactIfNotFound) {
	if (Object.hasOwnProperty.call(session.custom, 'ContactInfoList') && !empty(session.custom.ContactInfoList)) {
		var contactInfoList = JSON.parse(session.custom.ContactInfoList);

		if (!empty(email)) {
			for (var index = 0; index < contactInfoList.length; index++) {
				if (contactInfoList[index].Email === email) {
					return contactInfoList[index];
				}
			}
		}

		if (returnFirstContactIfNotFound && contactInfoList.length > 0) { return contactInfoList[0]; }
	}

	return null;
}

/**
 * This function removes the matched contact ids from session.
 * @param {Object} contactInfo - Required. The only required attribute in the JSON is 'Email'.
 * The JSON object should have, at a minimum, the basic information on a contact:
 * { "FirstName": "Hank", "LastName": "McHankerson", "Email": "hank+4@mailinator.com", "id": "0033C00000X7YjCQAV" }
   Other fields that are part of the Salesforce Contact object can also be passed, for example, "LeadSource": "Web"
   (there are many more)
 */
function removeContactInfoFromSession(contactInfo) {
	if (Object.hasOwnProperty.call(session.custom, 'ContactInfoList') && !empty(session.custom.ContactInfoList)) {
		var contactInfoList = JSON.parse(session.custom.ContactInfoList);

		var filteredList = contactInfoList.filter(function (contactInfoFromSession) {
			return !(contactInfoFromSession.Email === contactInfo.Email && contactInfoFromSession.FirstName === contactInfo.FirstName && contactInfoFromSession.LastName === contactInfo.LastName)
		});

		session.custom.ContactInfoList = JSON.stringify(filteredList);
	}
}

/**
 * This function uses the given contactInfo object to return a new object
 * that is more suitable to pass to Account table for creating/updating a PersonAccount.
 * @param {Object} contactInfo  - Required. The only required attribute in the JSON is 'Email'.
 * The JSON object should have, at a minimum, the basic information on a contact:
 * { "FirstName": "Hank", "LastName": "McHankerson", "Email": "hank+4@mailinator.com", "id": "0033C00000X7YjCQAV" }
   Other fields that are part of the Salesforce Contact object can also be passed, for example, "LeadSource": "Web"
   (there are many more)
 */
function updateContactInfoForSavingToPersonAccount(contactInfo) {
	var personAccountRecordTypeId = dw.system.Site.current.getCustomPreferenceValue('ServiceCloud-PersonAccountRecordTypeId');
	var customerListId = null;

	if (session.customer && session.customer.registered) {
		customerListId = dw.system.Site.current.getCustomPreferenceValue('ServiceCloud-CustomerListId');
	}
	var lastName = 'N/A';
	if (!empty(contactInfo.LastName)) {
		lastName = contactInfo.LastName;
	}

	var personAccountContactInfo = {
		'RecordTypeId': personAccountRecordTypeId,
		'PersonEmail': contactInfo.Email,
		'FirstName': contactInfo.FirstName,
		'LastName': lastName
	};

	if (!empty(customerListId)) {
		personAccountContactInfo['B2C_CustomerList__pc'] = customerListId;
	}

	return personAccountContactInfo;
}

module.exports = exports;
