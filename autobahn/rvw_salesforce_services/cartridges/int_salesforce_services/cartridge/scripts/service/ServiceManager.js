/**
 *   This is the entry point, the file that would be required, by a consumer wanting to call Service Cloud.
 *   The purpose of the functions here are to provide a consumer friendly means to sending and retrieving
 *   data from Service Cloud.
 *   For example, there may be numerous "Query" functions here where the caller can provide and Id, Email Address, etc.
 *   to get back data. The function here then builds the underlying query and passes it along to be executed.
 *
 *   This file may be extended or overridden by a client cartridge to provide additional functionality.
 */

 'use strict';

 var RequestFactory = require('*/cartridge/scripts/service/ServiceRequestFactory');
 var ResponseFactory = require('*/cartridge/scripts/service/ServiceResponseFactory');
 var ObjectActionDescriptions = require('*/cartridge/scripts/constants/SalesforceConstants').ObjectActionDescriptions;
 var ObjectNames = require('*/cartridge/scripts/constants/SalesforceConstants').ObjectNames;
 var SalesforceClouds = require('*/cartridge/scripts/constants/SalesforceConstants').SalesforceClouds;
 var ServiceCloudEndpoints = require('*/cartridge/scripts/constants/SalesforceConstants').ServiceCloudEndpoints;
 var ServiceFactory = require('*/cartridge/scripts/ServiceFactory');

 /* ***** Public Method declarations ***** */
 exports.QueryForCaseById = queryForCaseById;
 exports.QueryForLeadByEmail = queryForLeadByEmail;
 exports.QueryObjectByAttributeStringValue = queryObjectByAttributeStringValue;
 exports.GetSubscriberKey = getSubscriberKey;
 exports.GetSubscriberKeyFromContactInfo = getSubscriberKeyFromContactInfo;
 exports.GetSubscriberKeyFromFullName = getSubscriberKeyFromFullName;
 exports.GetContactId = getContactId;
 exports.GetPersonAccountId = getPersonAccountId;
 exports.CreateCaseWithContact = createCaseWithContact;
 exports.CreateCaseWithPersonAccount = createCaseWithPersonAccount;
 exports.CreateObject = createObject;
 exports.UpdateObject = updateObject;

 /* ***** Public Functions definitions ***** */
 /**
  * This is a function meant for a specific query; a Case object (row) by it's unique (Salesforce) Identifier.
  * @param {String} caseId - Required. The value of the attribute to use to find a row(s) in the object. Example value would be "0031100001rhvEhAAI"
  * @returns {Object} - A JSON object in the format returned from Salesforce.
  */
 function queryForCaseById(caseId) {
	 return queryObjectByAttributeStringValue('FIELDS(ALL)', 'Case', 'Id', caseId);
 }

 /**
  * This is a function meant for a specific query; a Lead object (row) by an email address.
  * @param {String} value - Required. The value of the attribute to use to find a row(s) in the object. Example value would be "hank@mailinator.com"
  * @returns {Object} - A JSON object in the format returned from Salesforce.
  */
 function queryForLeadByEmail(email) {
	 return queryObjectByAttributeStringValue('Email+,+FirstName+,+LastName+,+CreatedDate', 'Lead', 'Email', email);
 }

 /**
  * This is a generic function for performing various select queries from a Salesforce object where looking for someAttribute equals someValue.
  * @param {String} selectFields - Required. This is what fields are to be selected and returned. Example values are; 'FIELDS(ALL)', 'Id', 'Email+,+FirstName+,+LastName'
  * @param {String} objectName - Required. The name of the object that will be executed against. Example values are; "Account", "Case", "Contact" and "Lead"
  * @param {String} attributeId - Required. The name of the attribute to be used for selecting a row(s) in the object.  Example values are; "Id", "Email"
  * @param {String} value - Required. The value of the attribute to use to find a row(s) in the object. Example values are; "0031100001rhvEhAAI", "hank@mailinator.com"
  * @returns {Object} - A JSON object in the format returned from Salesforce.
  */
 function queryObjectByAttributeStringValue(selectFields, objectName, attributeId, value) {
	 let query = 'SELECT+' + selectFields + '+from+' + objectName + '+where+' + attributeId + '=%27' + encodeURIComponent(value) + '%27+LIMIT+200';
	 return queryServiceCloud(query);
 }

 function getSubscriberKeyFromFullName(email, fullName, objectName, updateContactIfExists) {
	 var trimmedFullName = fullName.trim();
	 var names = trimmedFullName.split(' ');
	 var firstName = names.length > 0 ? names[0] : '';
	 var lastName = names.length > 1 ? names[1] : '';

	 return getSubscriberKeyFromContactInfo(email, firstName, lastName, objectName, updateContactIfExists);
 }

 function getSubscriberKeyFromContactInfo(email, firstName, lastName, objectName, updateContactIfExists) {
	 var contactInfo = { 'Email': email};
	 var localFirstName = firstName ? firstName : '';
	 var localLastName = lastName ? lastName : '';
	 if (updateContactIfExists) {
		 if (!empty(localFirstName)) { contactInfo['FirstName'] = localFirstName; };
		 if (!empty(localLastName)) { contactInfo['LastName'] = localLastName; };
	 } else {
		 contactInfo['FirstName'] = localFirstName;
		 contactInfo['LastName'] = localLastName;
	 }

	 return getSubscriberKey(contactInfo, objectName, updateContactIfExists);
 }

 /**
  * This function is used to get the unique identifier that should be passed to Marketing Cloud
  * for operations such as executing a triggered send, firing a journey or inserting into a Data Extension.
  * The 'MarketingCloudUseContactIdForSubscriberKey' site preference will be checked. If it is not set or false,
  * then the contact's email address will be returned. If true, then a call will be made to Service Cloud
  * to get the identifier for the customer that is either a Contact or a PersonAccount
  * @param {Object} contactInfo - Required. The only required attribute in the JSON is 'Email'.
  * The JSON object should have, at a minimum, the basic information on a contact:
  * { "FirstName": "Hank", "LastName": "McHankerson", "Email": "hank+4@mailinator.com" }
	Other fields that are part of the Salesforce Contact object can also be passed, for example, "LeadSource": "Web"
	(there are many more)
  * @param {String} objectName - Optional. The name of the object that stores customer information in SC.
	Valid values are "Contact" or "Account" (meaning 'PersonAccount'). If not supplied, the function will default to 'Account'.
  * @param {Boolean} updateContactIfExists - Optional. Assumed to be false if not supplied. If true , then if a
	contact exists, the given contactInfo will be passed as an update (PATCH) to Service Cloud.
  * @returns
  */
 function getSubscriberKey(contactInfo, objectName, updateContactIfExists) {
	 var site = require('dw/system/Site');
	 var subscriberKey = contactInfo.Email;
	 var useContactId = site.current.getCustomPreferenceValue('MarketingCloudUseContactIdForSubscriberKey');

	 if (useContactId) {
		 var localObjectName = objectName || 'Account';
		 if (localObjectName === ObjectNames.Account) {
			 subscriberKey = getPersonAccountId(contactInfo, updateContactIfExists);
		 } else if (localObjectName === ObjectNames.Contact) {
			 subscriberKey = getContactId(contactInfo, updateContactIfExists);
		 }
	 }

	 return subscriberKey;
 }

 /**
  * This function will create a Contact, if it doesn't already exist by email address, and return the ContactId.
  * NOTE: The JSON object parameters are expected to be relatively simple objects that look like this:
  * { "Attribute1Name": "Attribute1Value", "Attribute2Name": "Attribute2Value"}
  * See the documentation from Salesforce for details on fields on the different objects a/o Postman API calls to Salesforce.
  * It is beyond the scope of code documentation to define all the options here or provide an example with all options
  * (there are sometimes hundreds of attributes on any given standard Salesforce object)
  * @param {Object} contactInfo - Required. The only required attribute in the JSON is 'Email'.
  * The JSON object should have, at a minimum, the basic information on a contact:
  * { "FirstName": "Hank", "LastName": "McHankerson", "Email": "hank+4@mailinator.com" }
	Other fields that are part of the Salesforce Contact object can also be passed, for example, "LeadSource": "Web"
	(there are many more)
  * @param {Boolean} updateContactIfExists - Optional. Assumed to be false if not supplied. If true , then if a
	contact exists, the given contactInfo will be passed as an update (PATCH) to Service Cloud.
  * @returns {String} - The identifier of the Contact for the given contactInfo (typically email address)
  */
 function getContactId(contactInfo, updateContactIfExists) {
	 var localUpdateContactIfExists = false;
	 if (!empty(updateContactIfExists) && (updateContactIfExists === true || updateContactIfExists === 'true')) {
		 localUpdateContactIfExists = true;
	 }
	 return getContactIdCreateRecordIfNecessary(contactInfo, ObjectNames.Contact, localUpdateContactIfExists);
 }

 /**
  * This function will create an Account, if it doesn't already exist by email address, and return the PersonAccountId.
  * NOTE: The JSON object parameters are expected to be relatively simple objects that look like this:
  * { "Attribute1Name": "Attribute1Value", "Attribute2Name": "Attribute2Value"}
  * See the documentation from Salesforce for details on fields on the different objects a/o Postman API calls to Salesforce.
  * It is beyond the scope of code documentation to define all the options here or provide an example with all options
  * (there are sometimes hundreds of attributes on any given standard Salesforce object)
  * @param {Object} contactInfo - Required. The only required attribute in the JSON is 'Email'.
  * The JSON object should have, at a minimum, the basic information on a contact:
  * { "FirstName": "Hank", "LastName": "McHankerson", "PersonEmail": "hank+4@mailinator.com" }
	Other fields that are part of the Salesforce Contact object can also be passed, for example, "LeadSource": "Web"
	(there are many more)
  * @param {Boolean} updateContactIfExists - Optional. Assumed to be false if not supplied. If true , then if a
	contact exists, the given contactInfo will be passed as an update (PATCH) to Service Cloud.
  * @returns {String} - The identifier of the Contact for the given contactInfo (typically email address)
  */
 function getPersonAccountId(contactInfo, updateContactIfExists) {
	 var localUpdateContactIfExists = false;
	 if (!empty(updateContactIfExists) && (updateContactIfExists === true || updateContactIfExists === 'true')) {
		 localUpdateContactIfExists = true;
	 }
	 return getContactIdCreateRecordIfNecessary(contactInfo, ObjectNames.Account, localUpdateContactIfExists);
 }

 /**
  * This function will create a Case, and if the Contact information is supplied, will look up that Contact by email and get their ContactId.
  * If not found, the Contact will be created. The ContactId will be added to the given CaseInfo object.
  * NOTE: The JSON object parameters are expected to be relatively simple objects that look like this:
  * { "Attribute1Name": "Attribute1Value", "Attribute2Name": "Attribute2Value"}
  * See the documentation from Salesforce for details on fields on the different objects a/o Postman API calls to Salesforce.
  * It is beyond the scope of code documentation to define all the options here or provide an example with all options
  * (there are sometimes hundreds of attributes on any given standard Salesforce object)
  * @param {Object} caseInfo - Required. The information to be passed to Salesforce to create a case.
  * Different use cases will have different data sets for a case, so there isn't necessarily a "must have these" fields.
  * However, an example might be something as simple as
  * { "Subject": "Case created from web site for XXX", "Description": "This Case was created from the website for XXX use case." }
  * There may be custom properties that are also included. For example, if the case is for a Warranty support ticket:
  * { "Serial_Number__c": "20210203-07998001", "Product_Code__c": "ABCD-123", "Date_of_Sale__c": "2021-09-25" }
  * @param {Object} contactInfo - Optional. If not provided, no contact information will be included when the case is created.
  * The JSON object should have, at a minimum, the basic information on a contact:
  * { "FirstName": "Hank", "LastName": "McHankerson", "Email": "hank+4@mailinator.com" }
	Other fields that are part of the Salesforce Contact object can also be passed, for example, "LeadSource": "Web"
	(there are many more)
  * @returns {Object} - A JSON object in the format returned from Salesforce.
  */
 function createCaseWithContact(caseInfo, contactInfo) {
	 let contactId = getContactId(contactInfo);
	 caseInfo.ContactId = contactId;
	 return createObject(ObjectNames.Case, caseInfo);
 }

 /**
  * This function will create a Case, and if the Contact information is supplied, will look up that PersonAccount by email and get their unique Id.
  * If not found, the PersonAccount will be created. The unique Id will be added to the given CaseInfo object.
  * NOTE: The JSON object parameters are expected to be relatively simple objects that look like this:
  * { "Attribute1Name": "Attribute1Value", "Attribute2Name": "Attribute2Value"}
  * See the documentation from Salesforce for details on fields on the different objects a/o Postman API calls to Salesforce.
  * It is beyond the scope of code documentation to define all the options here or provide an example with all options
  * (there are sometimes hundreds of attributes on any given standard Salesforce object)
  * @param {Object} caseInfo - Required. The information to be passed to Salesforce to create a case.
  * Different use cases will have different data sets for a case, so there isn't necessarily a "must have these" fields.
  * However, an example might be something as simple as
  * { "Subject": "Case created from web site for XXX", "Description": "This Case was created from the website for XXX use case." }
  * There may be custom properties that are also included. For example, if the case is for a Warranty support ticket:
  * { "Serial_Number__c": "20210203-07998001", "Product_Code__c": "ABCD-123", "Date_of_Sale__c": "2021-09-25" }
  * @param {Object} contactInfo - Optional. If not provided, no contact information will be included when the case is created.
  * The JSON object should have, at a minimum, the basic information on a contact:
  * { "FirstName": "Hank", "LastName": "McHankerson", "Email": "hank+4@mailinator.com" }
	Other fields that are part of the Salesforce Contact object can also be passed, for example, "LeadSource": "Web"
	(there are many more)
  * @param {Boolean} updateContactIfExists - Optional. Assumed to be false if not supplied. If true , then if a
	contact exists, the given contactInfo will be passed as an update (PATCH) to Service Cloud.
  * @returns {Object} - A JSON object in the format returned from Salesforce.
  */
 function createCaseWithPersonAccount(caseInfo, contactInfo, updateContactIfExists) {
	 var contactId = getPersonAccountId(contactInfo);
	 caseInfo.ContactId = contactId;
	 return createObject(ObjectNames.Case, caseInfo);
 }

 /**
  * This is a generic function meant to create a row (instance) of the specified Salesforce object.
  * NOTE: The JSON object parameters are expected to be relatively simple objects that look like this:
  * { "Attribute1Name": "Attribute1Value", "Attribute2Name": "Attribute2Value"}
  * See the documentation from Salesforce for details on fields on the different objects a/o Postman API calls to Salesforce.
  * It is beyond the scope of code documentation to define all the options here or provide an example with all options
  * (there are sometimes hundreds of attributes on any given standard Salesforce object)
  * @param {String} objectName - Required. The name of the object that will have a row created for. Example values are; "Account", "Case", "Contact" and "Lead"
  * @param {Object} jsonData - Required. The data that will be inserted into the specified Salesforce object.
  * The JSON object is expected to be a relatively simple object that will look like this:
  * { "Attribute1Name": "Attribute1Value", "Attribute2Name": "Attribute2Value"}
  * An example would be, for inserting a Contact:
  * { "FirstName": "Hank", "LastName": "McHankerson", "Email": "hank+4@mailinator.com" }
	Other fields that are part of the Salesforce Contact object can also be passed, for example, "LeadSource": "Web"
	(there are many, many more)
  * @returns {Object} - A JSON object in the format returned from Salesforce.
  */
 function createObject(objectName, jsonData) {
	 return createUpdateDeleteObject(objectName, null, ObjectActionDescriptions.Create, jsonData);
 }

 /**
  * This is a generic function meant to update a row (instance) of the specified Salesforce object.
  * NOTE: The JSON object parameters are expected to be relatively simple objects that look like this:
  * { "Attribute1Name": "Attribute1Value", "Attribute2Name": "Attribute2Value"}
  * See the documentation from Salesforce for details on fields on the different objects a/o Postman API calls to Salesforce.
  * It is beyond the scope of code documentation to define all the options here or provide an example with all options
  * (there are sometimes hundreds of attributes on any given standard Salesforce object)
  * @param {String} objectName - Required. The name of the object that will have a row created for. Example values are; "Account", "Case", "Contact" and "Lead"
  * @param {String} objectKey - Required. The unique identifier of the object that is to be updated. Typically will be something like this: '0033C00000Y3Ju9QAF'
 * @param {Object} jsonData - Required. The data that will be updated into the specified Salesforce object.
  * The JSON object is expected to be a relatively simple object that will look like this:
  * { "Attribute1Name": "Attribute1Value", "Attribute2Name": "Attribute2Value"}
  * An example would be, for inserting a Contact:
  * { "FirstName": "Hank", "LastName": "McHankerson", "Email": "hank+4@mailinator.com" }
	Other fields that are part of the Salesforce Contact object can also be passed, for example, "LeadSource": "Web"
	(there are many, many more)
  * @returns {Object} - A JSON object in the format returned from Salesforce.
  */
 function updateObject(objectName, objectKey, jsonData) {
	 var objectInfo = jsonData;
	 if (objectName === ObjectNames.Account) {
		 var serviceHelper = require('*/cartridge/scripts/helpers/ServiceHelper');
		 objectInfo = serviceHelper.UpdateContactInfoForSavingToPersonAccount(jsonData);
	 }
	 return createUpdateDeleteObject(objectName, objectKey, ObjectActionDescriptions.Update, objectInfo);
 }

 /* ***** Private Functions ***** */
 function queryServiceCloud(query) {
	 let serviceCloud = ServiceFactory.GetService(SalesforceClouds.Service, ServiceCloudEndpoints.Query);
	 let serviceReadyForRequest = RequestFactory.GetQueryRequest(query, serviceCloud, ServiceCloudEndpoints.Query);
	 if (serviceReadyForRequest) {
		 let queryResponse = serviceCloud.call(null);
		 var authenticationHelper = require('*/cartridge/scripts/AuthenticationHelper');
		 let newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Service, queryResponse);
		 if (newTokenNeeded) {
			 serviceCloud = ServiceFactory.GetService(SalesforceClouds.Service, ServiceCloudEndpoints.Query);
			 serviceReadyForRequest = RequestFactory.GetQueryRequest(query, serviceCloud, ServiceCloudEndpoints.Query);
			 if (serviceReadyForRequest) {
				 queryResponse = serviceCloud.call(null);
				 newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Service, queryResponse);
				 if (newTokenNeeded) {
					 throw new Error('On successive attempts, calling the Service Cloud API is still returning a 401 Error.');
				 }
			 }
		 }

		 return ResponseFactory.ProcessGenericResponse(queryResponse);
	 }
 }

 function getContactIdCreateRecordIfNecessary(contactInfo, objectName, updateContactIfExists) {
	 var logger = require('dw/system/Logger');
	 var serviceHelper = require('*/cartridge/scripts/helpers/ServiceHelper');

	 var contactInfoInSession = false;
	 var contactId = serviceHelper.GetContactIdFromSession(contactInfo);
	 if (contactId) {
		 contactInfoInSession = true;
	 }

	 if (contactId === null && contactInfo && 'Email' in contactInfo && !empty(contactInfo.Email)) {
		 contactId = getContactIdByQuery(contactInfo, objectName, true);
	 }

	 var contactWasCreated = false;
	 if (contactId === null) {
		 contactId = createContactAndReturnId(contactInfo, objectName);
		 contactWasCreated = !empty(contactId);
	 }

	 if (contactWasCreated === false && updateContactIfExists === true) {
		 var updateResponse = updateObject(objectName, contactId, contactInfo);
	 }

	 if (contactInfoInSession === false) {
		 serviceHelper.AddContactInfoToSession(contactInfo, contactId);
	 }

	 return contactId;
 }

 function getContactIdByQuery(contactInfo, objectName, useEmail) {
	 var contactId = null;

	 var queryInfo = getQueryInfo(objectName, useEmail);
	 var contactResponse = queryObjectByAttributeStringValue(queryInfo.IdColumnName, queryInfo.ObjectName, queryInfo.ColumnNameValue, contactInfo[useEmail ? 'Email' : 'Id']);
	 if (contactResponse.SalesforceInfo && 'totalSize' in contactResponse.SalesforceInfo &&
		 contactResponse.SalesforceInfo.totalSize >= 1 && contactResponse.SalesforceInfo.records.length > 0) {
		 if (objectName === ObjectNames.Contact) {
			 contactId = contactResponse.SalesforceInfo.records[0].Id;
		 } else if (objectName === ObjectNames.Account) {
			 contactId = contactResponse.SalesforceInfo.records[0].PersonContactId;
		 } else {
			 var logger = require('dw/system/Logger');
			 logger.info("No Id or PersonContactId returned from Service Cloud in a record for " + contactInfo.Email);
		 }
	 }

	 return contactId;
 }

 function createContactAndReturnId(contactInfo, objectName) {
	 var objectInfo = contactInfo;
	 var createContactResponse = null;

	 if (objectName === ObjectNames.Account) {
		 var serviceHelper = require('*/cartridge/scripts/helpers/ServiceHelper');
		 objectInfo = serviceHelper.UpdateContactInfoForSavingToPersonAccount(contactInfo);
	 }

	 createContactResponse = createObject(objectName, objectInfo);

	 return getContactIdByQuery(createContactResponse, objectName);
 }

 function getQueryInfo(objectName, useEmail) {
	 var queryInfo = getEmptyQueryInfo();

	 switch (objectName) {
		 case ObjectNames.Account:
			 queryInfo.IdColumnName = 'PersonContactId';
			 queryInfo.ObjectName = ObjectNames.Account;
			 queryInfo.ColumnNameValue = useEmail ? 'PersonEmail' : 'Id';
			 break;
		 default:
			 queryInfo.IdColumnName = 'Id';
			 queryInfo.ObjectName = ObjectNames.Contact;
			 queryInfo.ColumnNameValue = useEmail ? 'Email' : 'Id';
			 break;
	 }

	 return queryInfo;
 }

 function getEmptyQueryInfo() {
	return {
		 'IdColumnName': '',
		 'ObjectName': '',
		 'ColumnNameValue': ''
	 };
 }

 function createUpdateDeleteObject(objectName, objectKey, objectAction, jsonData) {
	 let serviceCloud = ServiceFactory.GetService(SalesforceClouds.Service, ServiceCloudEndpoints.SalesforceObject);
	 let requestReady = RequestFactory.GetObjectRequest(objectName, serviceCloud, ServiceCloudEndpoints.SalesforceObject, objectAction, objectKey);
	 if (requestReady) {
		 let crudResponse = serviceCloud.call(JSON.stringify(jsonData));
		 var authenticationHelper = require('*/cartridge/scripts/AuthenticationHelper');
		 let newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Service, crudResponse);
		 if (newTokenNeeded) {
			 serviceCloud = ServiceFactory.GetService(SalesforceClouds.Service, ServiceCloudEndpoints.SalesforceObject);
			 requestReady = RequestFactory.GetObjectRequest(objectName, serviceCloud, ServiceCloudEndpoints.SalesforceObject, objectAction, objectKey);
			 if (requestReady) {
				 crudResponse = serviceCloud.call(JSON.stringify(jsonData));
				 newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Service, crudResponse);
				 if (newTokenNeeded) {
					 throw new Error('On successive attempts, calling the Service Cloud API is still returning a 401 Error.');
				 }
			 }
		 }

		 return ResponseFactory.ProcessObjectResponse(crudResponse, objectName, objectAction);
	 }
 }
