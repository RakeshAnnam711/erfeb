/**
*   This is the entry point, the file that would be required, by a consumer wanting to call Marketing Cloud.
*   The purpose of the functions here are to provide a consumer friendly means to sending and retrieving
*   data from Marketing Cloud.
*   For example, there may be numerous "Query" functions here where the caller can provide and Id, Email Address, etc.
*   to get back data. The function here then builds the underlying query and passes it along to be executed.
*
*   This file may be extended or overridden by a client cartridge to provide additional functionality.
*/

'use strict';

var Site = require('dw/system/Site');

var RequestFactory = require('*/cartridge/scripts/marketing/MarketingRequestFactory');
var ResponseFactory = require('*/cartridge/scripts/marketing/MarketingResponseFactory');
var SalesforceClouds = require('*/cartridge/scripts/constants/SalesforceConstants').SalesforceClouds;
var MarketingCloudEndpoints = require('*/cartridge/scripts/constants/SalesforceConstants').MarketingCloudEndpoints;

var ServiceFactory = require('*/cartridge/scripts/ServiceFactory');

/* ***** Public Method declarations ***** */
exports.ValidateEmailAddress = validateEmailAddress;
exports.QueryForContentAsset = queryForContentAsset;
exports.InsertIntoContentAsset = insertIntoContentAsset;
exports.InsertIntoDataEvents = insertIntoDataEvents;
exports.InsertIntoDataExtension = insertIntoDataExtension;
exports.ExecuteTriggeredSend = executeTriggeredSend;
exports.GetDeliveryDetails = getDeliveryDetails;
exports.FireJourneyEvent = fireJourneyEvent;
exports.GetExternalKey = getExternalKey;
exports.AddCustomerToNewsletterList = addCustomerToNewsletterList;
exports.ExecuteOrderConfirmationSend = executeOrderConfirmationSend;
exports.GetSubscriptionSubscriberList = getSubscriptionSubscriberList;
exports.UpdateSubscriptionSubscriberLists = UpdateSubscriptionSubscriberLists;
exports.GetAllList = getAllList;
exports.GetEmailFromSubscriberId = getEmailFromSubscriberId;

/* ***** Public Functions definitions ***** */

/**
 * Will insert row(s) into a Data Events in Marketing Cloud using it's External Key and returns the JSON from Salesforce.
 * @param {String} externalKey - Required. The External Key (not the name) of the Data Events to insert row(s) into. e.g. 'rvw_style_sfcc'
 * @param {Array} arrayOfItems - Required. The items to be inserted into the Data Events. This must be an array of JSON objects. e.g. { keys: { Key: 'payloadKey' } }, values: { Value: 'cssVarValue', Name: 'payloadName' } };
 * Each property of the object should be the name of a field in the Data Events and the data should be in the proper format.
 * @returns {Object} - A JSON object in the format returned from Salesforce.
 */
function insertIntoDataEvents(externalKey, arrayOfItems) {
    let marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.DataEvents);
    let dataEventsRequest = RequestFactory.GetInsertIntoDataEventsRequest(externalKey, arrayOfItems, marketingService);

    if (dataEventsRequest !== null) {
        let dataEventsResponse = marketingService.call(JSON.stringify(dataEventsRequest));
        var authenticationHelper = require('*/cartridge/scripts/AuthenticationHelper');
        let newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, dataEventsResponse);

        if (newTokenNeeded) {
            marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.DataEvents);
            dataEventsRequest = RequestFactory.GetInsertIntoDataEventsRequest(externalKey, arrayOfItems, marketingService);

            if (dataEventsRequest !== null) {
                dataEventsResponse = marketingService.call(JSON.stringify(dataEventsRequest));
                newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, dataEventsResponse);
                if (newTokenNeeded) {
                    throw new Error('On successive attempts, calling the Marketing Cloud API is still returning a 401 Error.');
                }
            }
        }

        return ResponseFactory.ProcessGenericRestResponse(dataEventsResponse);
    }
}

/**
 * Passes the given email address to Marketing Cloud to be validated and returns the JSON response.
* @param {String} emailAddress - Required. The email address to validate.
* @returns {Object} - A JSON object in the format returned from Salesforce.
* @example
    The object returned will like this:
    { email: 'my.email@mailinator.com',
      valid: true };
*/
function validateEmailAddress(emailAddress) {
    let marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.AddressValidation);
    let validateEmailRequest = RequestFactory.GetValidateEmailAddressRequest(emailAddress, marketingService);
    if (validateEmailRequest !== null) {
        let validationResponse = marketingService.call(JSON.stringify(validateEmailRequest));
        var authenticationHelper = require('*/cartridge/scripts/AuthenticationHelper');
        let newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, validationResponse);
        if (newTokenNeeded) {
            marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.AddressValidation);
            validateEmailRequest = RequestFactory.GetValidateEmailAddressRequest(emailAddress, marketingService);
            if (validateEmailRequest !== null) {
                validationResponse = marketingService.call(JSON.stringify(validateEmailRequest));
                newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, validationResponse);
                if (newTokenNeeded) {
                    throw new Error('On successive attempts, calling the Marketing Cloud API is returning a 401 Error.');
                }
            }
        }

        return ResponseFactory.ProcessGenericRestResponse(validationResponse);
    }
}

/**
 * Queries Marketing Cloud for a specific Content Asset and returns the JSON from Salesforce. IMPORTANT: Either AssetID or AssetFilter is a required parameter.
 * @param {String} assetId - Required/Optional. The identifier of a content asset in Marketing Cloud; e.g. '32647'
 * @param {String} assetFilter - Optional/Required. The filter for content assets in Marketing Cloud; e.g. "CustomerKey eq 'brand_logo_desktop'"
 * @returns {Object} - A JSON object in the format returned from Salesforce.
 */
function queryForContentAsset(assetId, assetFilter) {
    let marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.Query);
    let serviceReadyForRequest = RequestFactory.GetQueryContentAssetByIdRequest(assetId, assetFilter, marketingService);
    if (serviceReadyForRequest) {
        let queryResponse = marketingService.call(null);
        var authenticationHelper = require('*/cartridge/scripts/AuthenticationHelper');
        let newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, queryResponse);
        if (newTokenNeeded) {
            marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.Query);
            serviceReadyForRequest = RequestFactory.GetQueryContentAssetByIdRequest(assetId, assetFilter, marketingService);
            if (serviceReadyForRequest) {
                queryResponse = marketingService.call(null);
                newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, queryResponse);
                if (newTokenNeeded) {
                    throw new Error('On successive attempts, calling the Marketing Cloud API is still returning a 401 Error.');
                }
            }
        }

        return ResponseFactory.ProcessGenericRestResponse(queryResponse);
    }
}

/**
 * Will insert Content Assets into Marketing Cloud
 * @param {String} assetId - Optional. The identifier of a content asset in Marketing Cloud; e.g. '32647'. Required for patch requests
 * @param {Object} assetObject - Required. The object to be inserted into a Content Asset.
 * @returns {Object} - A JSON object in the format returned from Salesforce.
 */
function insertIntoContentAsset(assetId, assetObject) {
    let marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.Query);
    let queryInsertRequest = RequestFactory.GetInsertContentAssetRequest(assetId, assetObject, marketingService);
    if (queryInsertRequest !== null) {
        let queryInsertResponse = marketingService.call(JSON.stringify(queryInsertRequest));
        var authenticationHelper = require('*/cartridge/scripts/AuthenticationHelper');
        let newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, queryInsertResponse);
        if (newTokenNeeded) {
            marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.DataExtension);
            queryInsertRequest = RequestFactory.GetInsertContentAssetRequest(assetId, assetObject, marketingService);
            if (queryInsertRequest !== null) {
                queryInsertResponse = marketingService.call(JSON.stringify(queryInsertRequest));
                newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, queryInsertResponse);
                if (newTokenNeeded) {
                    throw new Error('On successive attempts, calling the Marketing Cloud API is still returning a 401 Error.');
                }
            }
        }

        return ResponseFactory.ProcessGenericRestResponse(queryInsertResponse);
    }
}

/**
 * Will insert row(s) into a Data Extension in Marketing Cloud using it's External Key and returns the JSON from Salesforce.
 * @param {String} externalKey - Required. The External Key (not the name) of the Data Extension to insert row(s) into
 * @param {Array} arrayOfItems - Required. The items to be inserted into the Data Extension. This must be an array of JSON objects.
 * Each property of the object should be the name of a field in the Data Extension and the data should be in the proper format.
 * @returns {Object} - A JSON object in the format returned from Salesforce.
 * @example
    If the Data Extension had 2 columns, keys and values, the arrayOfItems could look like this:
    [
        { keys: { Key: 'button_primary_color'},
          values: { Name: 'Button Primary Color', Value: '#ffffff'}
        },
        { keys: { Key: 'button_primary_color_hover'},
          values: { Name: 'Button Primary Color Hover', Value: '#ffffff'}
        }
    ]
*/
function insertIntoDataExtension(externalKey, arrayOfItems) {
    let marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.DataExtension);
    let dataExtensionRequest = RequestFactory.GetInsertIntoDataExtensionRequest(externalKey, arrayOfItems, marketingService);
    if (dataExtensionRequest !== null) {
        let dataExtensionResponse = marketingService.call(JSON.stringify(dataExtensionRequest));
        var authenticationHelper = require('*/cartridge/scripts/AuthenticationHelper');
        let newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, dataExtensionResponse);
        if (newTokenNeeded) {
            marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.DataExtension);
            dataExtensionRequest = RequestFactory.GetInsertIntoDataExtensionRequest(externalKey, arrayOfItems, marketingService);
            if (dataExtensionRequest !== null) {
                dataExtensionResponse = marketingService.call(JSON.stringify(dataExtensionRequest));
                newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, dataExtensionResponse);
                if (newTokenNeeded) {
                    throw new Error('On successive attempts, calling the Marketing Cloud API is still returning a 401 Error.');
                }
            }
        }

        return ResponseFactory.ProcessInsertIntoDataExtensionResponse(dataExtensionResponse);
    }
}

/**
 * Will send the given extensionData to a Triggered Send (this also inserts into a Data Extension) in Marketing Cloud using it's External Key and returns the JSON from Salesforce.
 * @param {String} externalKey - Required. The External Key (not the name) of the Triggered Send to send the data to
 * @param {Array} extensionData - Required. The data to be sent to the Triggered Send. Note, this must include SubscriberKey and EmailAddress properties.
 * It should also include a property in the object should that is the name of each field in the Data Extension used by the Triggered Send.
 * @returns {Object} - A JSON object in the format returned from Salesforce.
 * @example
    If the Data Extension used by the Triggered send has 4 fields; SubscriberKey, EmailAddress, FirstName & LastName,
    and using ContactId for the Subscriber Key, then given JSON object should look like this:
    {SubscriberKey: "0033C00000WrNX6QAN", EmailAddress: "test-user@some-domain.com", FirstName: "Test", LastName: "User"}
*/
function executeTriggeredSend(externalKey, extensionData) {
    let marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.TriggeredSends);
    let triggeredSendRequest = RequestFactory.GetExecuteTriggeredSendRequest(externalKey, extensionData, marketingService);
    if (triggeredSendRequest !== null) {
        let triggeredSendResponse = marketingService.call(JSON.stringify(triggeredSendRequest));
        var authenticationHelper = require('*/cartridge/scripts/AuthenticationHelper');
        let newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, triggeredSendResponse);
        if (newTokenNeeded) {
            marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.TriggeredSends);
            triggeredSendRequest = RequestFactory.GetExecuteTriggeredSendRequest(externalKey, extensionData, marketingService);
            if (triggeredSendRequest !== null) {
                triggeredSendResponse = marketingService.call(JSON.stringify(triggeredSendRequest));
                newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, triggeredSendResponse);
                if (newTokenNeeded) {
                    throw new Error('On successive attempts, calling the Marketing Cloud API is still returning a 401 Error.');
                }
            }
        }
        var processedResponse = ResponseFactory.ProcessTriggeredSendResponse(triggeredSendResponse);
        var getDetailsAfterSend = Site.current.getCustomPreferenceValue('MarketingCloudGetDeliveryDetailsAfterTriggeredSend');
        if (getDetailsAfterSend && !empty(processedResponse.RecipientSendId)) {
            var deliveryDetailsResponse = getDeliveryDetails(externalKey, processedResponse.RecipientSendId);
            processedResponse.DeliveryStatus = deliveryDetailsResponse.Status;
            processedResponse.DeliveryErrorMessage = deliveryDetailsResponse.ErrorDescription;
            processedResponse.DeliveryTime = deliveryDetailsResponse.DeliveryTime;
        }

        return processedResponse;
    }
}

/**
 * Using the given recipientSendId will query for the status of the single send email, in this case,
 * it would be a Triggered Send.  The External Key is the key used for sending the email.
 * @param {String} externalKey - Required. The External Key (not the name) of the Triggered Send to send the data to
 * @param {String} recipientSendId - Required. The recipientSendId returned in the response from the email (triggered) send.
 * @returns {Object} - A JSON object in the format returned from Salesforce.
 * @example
    This call to SFMC is an HTTP GET where the URL is altered.
    It will look something like this:
    https://...rest.marketingcloudapis.com/messaging/v1/messageDefinitionSends/key:My_External_Key/deliveryRecords/41b07874-b496-4289-869b-0f65d6e94556
*/
function getDeliveryDetails(externalKey, recipientSendId) {
    let marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.TriggeredSends);
    let serviceReadyForCall = RequestFactory.GetDeliveryDetailsRequest(externalKey, recipientSendId, marketingService);
    if (serviceReadyForCall) {
        var deliveryDetailsResponse = marketingService.call(JSON.stringify(null));
        var authenticationHelper = require('*/cartridge/scripts/AuthenticationHelper');
        let newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, deliveryDetailsResponse);
        if (newTokenNeeded) {
            marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.TriggeredSends);
            serviceReadyForCall = RequestFactory.GetDeliveryDetailsRequest(externalKey, recipientSendId, marketingService);
            if (serviceReadyForCall) {
                deliveryDetailsResponse = marketingService.call(JSON.stringify(null));
                newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, deliveryDetailsResponse);
                if (newTokenNeeded) {
                    throw new Error('On successive attempts, calling the Marketing Cloud API is still returning a 401 Error.');
                }
            }
        }

        return ResponseFactory.ProcessDeliveryDetailsResponse(deliveryDetailsResponse);
    }
}

/**
 * Will fire the API event that is the start of a Journey in Marketing Cloud using it's Event Definition Key and returns the JSON from Salesforce.
 * @param {String} eventDefinitionKey - Required. The Event Definition Key (not the name) of the API Event that begins a Journey
 * @param {Object} journeyData - Required. The data to be sent to the Journey. Note, this must include SubscriberKey and EmailAddress properties.
 * It should also include a property in the object should that is the name of each field in the Data Extension used by the API Event.
 * @param {String} contactKey - Optional. The Contact Key of the individual to associate with the event for Journey.
 * The Contact Key is often the same as the SubscriberKey (email address), but can be unique id of a Contact.
 * If no value is provided, the SubscriberKey in the journeyData will be used for the ContactKey.
 * @returns {Object} - A JSON object in the format returned from Salesforce.
 * @example
    If the Data Extension used by the API Event has 4 fields; SubscriberKey, EmailAddress, FirstName & LastName,
    the given JSON object should look like this:
    {SubscriberKey: "test-user@some-domain.com", EmailAddress: "test-user@some-domain.com", FirstName: "Test", LastName: "User"}
*/
function fireJourneyEvent(eventDefinitionKey, journeyData, contactKey) {
    let marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.Journeys);
    let fireJourneyEventRequest = RequestFactory.GetFireJourneyEventRequest(eventDefinitionKey, journeyData, marketingService, contactKey);
    if (fireJourneyEventRequest !== null) {
        let fireJourneyEventResponse = marketingService.call(JSON.stringify(fireJourneyEventRequest));
        var authenticationHelper = require('*/cartridge/scripts/AuthenticationHelper');
        let newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, fireJourneyEventResponse);
        if (newTokenNeeded) {
            marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.Journeys);
            fireJourneyEventRequest = RequestFactory.GetFireJourneyEventRequest(eventDefinitionKey, journeyData, marketingService, contactKey);
            if (fireJourneyEventRequest !== null) {
                fireJourneyEventResponse = marketingService.call(JSON.stringify(fireJourneyEventRequest));
                newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, fireJourneyEventResponse);
                if (newTokenNeeded) {
                    throw new Error('On successive attempts, calling the Marketing Cloud API is still returning a 401 Error.');
                }
            }
        }

        return ResponseFactory.ProcessFireJourneyEventResponse(fireJourneyEventResponse);
    }
}

/**
 * This function is capable of handling both Multibrand and non-Multibrand sites alike.
 * This will grab the externalKey using a String value passed by the site preferences within attribute group 'MarketingCloudTransactionalEmails'.The string will
 * either be a JSON of multiple externalKeys mapped to Brands, or a single Key. If the String evaluates as a JSON it will return the correct External Key for
 * the current Brand using the session.sourceCodeInfo.code and the data in the JSON object. Otherwise it will return the value of the lone externalKey.
 * @param {String} externalKeyJsonString - Required. This is either a JSON object for Multibrand, or a single externalKey depending on how the site
 * is configured. There are two allowed formats for this site preference:
 *  Option 1 (For Multibrand): [{"BrandID":"examplebrand1","Key":"Example_Brand1_EmailType"},{"BrandID":"examplebrand2","Key":"Example_Brand2_EmailType"}]
 *  Option 2(Non - Multibrand): Example_Brand_EmailType
 * @returns {String} externalKey - A String that holds the external key for the current site
 */
 function getExternalKey(externalKeyJsonString) {
    var errorMessage = 'JSON string for Marketing Cloud External Keys by Brand is empty; cannot continue communication to Marketing Cloud without an external key.';
    if (!empty(externalKeyJsonString)) {
        try {
            // Test if variable is a JSON. If not return the key value
            try {
                var externalKeyJson = JSON.parse(externalKeyJsonString);
            }
            catch (ex) {
                return externalKeyJsonString;
            }
            var localSession = session;
            var brandId = localSession.custom && localSession.custom.siteContextID ? localSession.custom.siteContextID : '';
            if (!empty(brandId)) {
                for (var index = 0; index < externalKeyJson.length; index++) {
                    if (externalKeyJson[index].BrandId === brandId) {
                        return externalKeyJson[index].Key;
                    }
                }
            }
            errorMessage = 'Brand ID could not be found for local session; cannot continue communication to Marketing Cloud without an external key.';
        } catch (ex) {
            errorMessage = 'Error parsing JSON string for Marketing Cloud External Keys by Brand; cannot continue communication to Marketing Cloud without an external key: ' + ex;
        }
    }
    throw new Error(errorMessage);
}

/**
 * This function will attempt send the a confirmation email via Marketing Cloud.
 * @param {dw.order.Order} order - The order object
 * @returns {Object} responseInfo - An object that states if the email sent successfully
 * and holds the error message if any
 */
function executeOrderConfirmationSend(order) {
    var confirmationEmailHelper = require('*/cartridge/scripts/helpers/ConfirmationEmailHelper');
    var externalKeyJSONString = Site.current.getCustomPreferenceValue('TriggeredSendExternalKeyForOrderConfirmation');
    var payload = confirmationEmailHelper.createOrderPayload(order);
    setSubscriberKey(payload);
    var externalKey = getExternalKey(externalKeyJSONString);
    return executeTriggeredSend(externalKey, payload);
}

/**
 * Adds the given customer email address into the Data Extension for Newsletters.
 * @param {String} emailAddress - Required. The customer's email address.
 * @returns {Object} - A JSON object in the format returned from Salesforce.
 */
// TODO: For the AB team, to add another site preference here for
// "UseJourneyForNewsletterSignup" (a boolean).
// If true, then instead of calling "insertIntoDataExtension", the code would call
// the "fireJourneyEvent". Also needed would be to retrieve the "eventDefinitionKey"
// which probably should be a different Site Preference, something like
// "EventDefinitionKeyForNewsletter" rather than reusing the existing
// "DataExtensionExternalKeyForNewsletter".
// NOTE that the JSON data being passed in for the Journey will likely be the same,
// but might have to be formatted slightly different for a journey vs. a Data Extension.

function addCustomerToNewsletterList(emailAddress, contactId, firstName, lastName, source) {
    const localFirstName = firstName || '';
    const localLastName = lastName || '';

    const externalKeyJsonString = Site.current.getCustomPreferenceValue('DataExtensionExternalKeyForNewsletter');
    const journeyEventKeyJsonString = Site.current.getCustomPreferenceValue('JourneyEventDefinitionKeyForNewsletter');

    let response = {
        Successful: false
    };
    let customerInfo = {
        SubscriberKey: contactId,
        EmailAddress: emailAddress,
        FirstName: localFirstName,
        LastName: localLastName,
    };

    // 'JourneyEventDefinitionKeyForNewsletter' pref has a default value, so conditional is based on value of 'DataExtensionExternalKeyForNewsletter' pref which can be empty
    if (!!externalKeyJsonString) {
        const externalKey = getExternalKey(externalKeyJsonString);

        if (empty(customerInfo.SubscriberKey)) setSubscriberKey(customerInfo);
        response = insertIntoDataExtension(externalKey, [customerInfo]);
    } else {
        const journeyKey = getExternalKey(journeyEventKeyJsonString);
        customerInfo.Source = source || 'salesforce_services_newsletter';

        if (empty(customerInfo.SubscriberKey)) setSubscriberKey(customerInfo);
        response = fireJourneyEvent(journeyKey, customerInfo, null);
    }

    return response;
}

/**
 * Checks (if enabled) against service cloud contact id lookup to add SubscriberKey.
 * @param {Object} payload - Required. Must include FirstName, LastName, and Email properties.
 */
function setSubscriberKey(payload) {
    var subscriberKey = payload.EmailAddress;
    var useContactId = Site.current.getCustomPreferenceValue('MarketingCloudUseContactIdForSubscriberKey');
    if (useContactId) {
        var serviceManager = require('*/cartridge/scripts/service/ServiceManager');
        var contactInfo = { "FirstName": payload.FirstName, "LastName": payload.ShippingAddressLastName, "Email": payload.EmailAddress};
        subscriberKey = serviceManager.GetPersonAccountId(contactInfo);
    }

    payload['SubscriberKey'] = subscriberKey;
}

/**
 * Execute get request from MC subscriber specific subscription lists.
 * @param {String} emailAddress - Required. The customer's email address.
 * @returns {Object} - A JSON object in the format returned from Salesforce.
 */
function getSubscriptionSubscriberList(emailAddress) {
    // Conform to account SubscriberKey storefront requirements
    let subscriberObject = { EmailAddress: emailAddress, SubscriberKey: emailAddress };
    setSubscriberKey(subscriberObject);

    let marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.SOAPService);
    let SubscriptionSubscriberListRequest = RequestFactory.GetSubscriptionSubscriberListRequest(subscriberObject.SubscriberKey, marketingService);

    if (SubscriptionSubscriberListRequest !== null) {
        let SubscriptionSubscriberListResponse = marketingService.call(SubscriptionSubscriberListRequest.toXMLString());
        let authenticationHelper = require('*/cartridge/scripts/AuthenticationHelper');
        let newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, SubscriptionSubscriberListResponse);
        if (newTokenNeeded) {
            marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.SOAPService);
            SubscriptionSubscriberListRequest = RequestFactory.GetSubscriptionSubscriberListRequest(subscriberObject.SubscriberKey, marketingService);
            if (SubscriptionSubscriberListRequest !== null) {
                SubscriptionSubscriberListResponse = marketingService.call(SubscriptionSubscriberListRequest.toXMLString());
                newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, SubscriptionSubscriberListResponse);
                if (newTokenNeeded) {
                    throw new Error('On successive attempts, calling the Marketing Cloud SOAP API is still returning a 500 Error.');
                }
            }
        }

        return ResponseFactory.ProcessSubscriptionSubscriberListResponse(SubscriptionSubscriberListResponse);
    }

    return;
}

/**
 * Execute get request from MC subscriber specific subscription lists.
 * @param {String} emailAddress - Required.
 * @param {Object} ListArray - Required.
 * @returns {Object} - A JSON object in the format returned from Salesforce.
 */
function UpdateSubscriptionSubscriberLists(emailAddress, ListArray, createRequest) {
    // Conform to account SubscriberKey storefront requirements
    let subscriberObject = { EmailAddress: emailAddress, SubscriberKey: emailAddress };
    setSubscriberKey(subscriberObject);

    let marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.SOAPService);
    let SubscriptionSubscriberListRequest = RequestFactory.UpdateSubscriptionSubscriberListsRequest(subscriberObject, ListArray, marketingService, createRequest);

    if (SubscriptionSubscriberListRequest !== null) {
        let SubscriptionSubscriberListResponse = marketingService.call(SubscriptionSubscriberListRequest.toXMLString());
        let authenticationHelper = require('*/cartridge/scripts/AuthenticationHelper');
        let newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, SubscriptionSubscriberListResponse);
        if (newTokenNeeded) {
            marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.SOAPService);
            SubscriptionSubscriberListRequest = RequestFactory.UpdateSubscriptionSubscriberListsRequest(subscriberObject, ListArray, marketingService, createRequest);
            if (SubscriptionSubscriberListRequest !== null) {
                SubscriptionSubscriberListResponse = marketingService.call(SubscriptionSubscriberListRequest.toXMLString());
                newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, SubscriptionSubscriberListResponse);
                if (newTokenNeeded) {
                    throw new Error('On successive attempts, calling the Marketing Cloud SOAP API is still returning a 500 Error.');
                }
            }
        }

        return ResponseFactory.ProcessSubscriptionSubscriberListResponse(SubscriptionSubscriberListResponse);
    }

    return;
}

/**
 * Execute get request from MC all subscription lists.
 * @returns {Object} - A JSON object in the format returned from Salesforce.
 */
function getAllList(emailAddress) {
    let marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.SOAPService);
    let allListRequest = RequestFactory.GetAllListRequest(marketingService);

    if (allListRequest !== null) {
        let SubscriptionSubscriberListResponse = marketingService.call(allListRequest.toXMLString());
        let authenticationHelper = require('*/cartridge/scripts/AuthenticationHelper');
        let newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, SubscriptionSubscriberListResponse);
        if (newTokenNeeded) {
            marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.SOAPService);
            allListRequest = RequestFactory.GetAllListRequest(marketingService);
            if (allListRequest !== null) {
                SubscriptionSubscriberListResponse = marketingService.call(allListRequest.toXMLString());
                newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, SubscriptionSubscriberListResponse);
                if (newTokenNeeded) {
                    throw new Error('On successive attempts, calling the Marketing Cloud SOAP API is still returning a 500 Error.');
                }
            }
        }

        return ResponseFactory.ProcessAllListResponse(SubscriptionSubscriberListResponse);
    }

    return;
}

/**
 * Get email address from a Subscriber ID
 * @returns {String} - An email address associated with the Subscriber Id passed in
 */
function getEmailFromSubscriberId(subscriberId) {
    let marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.SOAPService);
    let EmailFromSubscriberIdRequest = RequestFactory.GetEmailFromSubscriberIdRequest(subscriberId, marketingService);

    if (EmailFromSubscriberIdRequest !== null) {
        let EmailFromSubscriberIdResponse = marketingService.call(EmailFromSubscriberIdRequest.toXMLString());
        let authenticationHelper = require('*/cartridge/scripts/AuthenticationHelper');
        let newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, EmailFromSubscriberIdResponse);
        if (newTokenNeeded) {
            marketingService = ServiceFactory.GetService(SalesforceClouds.Marketing, MarketingCloudEndpoints.SOAPService);
            EmailFromSubscriberIdRequest = RequestFactory.GetEmailFromSubscriberIdRequest(subscriberId, marketingService);
            if (EmailFromSubscriberIdRequest !== null) {
                EmailFromSubscriberIdResponse = marketingService.call(EmailFromSubscriberIdRequest.toXMLString());
                newTokenNeeded = authenticationHelper.NewTokenNeeded(SalesforceClouds.Marketing, EmailFromSubscriberIdResponse);
                if (newTokenNeeded) {
                    throw new Error('On successive attempts, calling the Marketing Cloud SOAP API is still returning a 500 Error.');
                }
            }
        }

        return ResponseFactory.ProcessEmailFromSubscriberIdResponse(EmailFromSubscriberIdResponse);
    }

    return;
}
