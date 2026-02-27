/* global dw */

'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger');
var service;

/**
 * Gets SFRA Version number if present
 * @return {string|null} - SFRA version or null if not a SFRA storefront
 */
function getSFRAVersion() {
    return dw.web.Resource.msg('global.version.number', 'version', '');
}

/**
 * Gets Site Genesis version number if present
 * @return {string|null} - Site Genesis version or null if not a site genesis storefront
 */
function getSGJCVersion() {
    return dw.web.Resource.msg('revisioninfo.revisionnumber', 'revisioninfo', '');
}

/**
 * Gets the storefront type and version
 * @return {string} - Storefront type and version
 */
function getStorefrontVersion() {
    var version = getSGJCVersion();

    if (version) {
        return 'SGJC/' + version;
    }

    version = getSFRAVersion();

    if (version) {
        return 'SFRA/' + version;
    }

    return '';
}

/**
 * Gets the commerce cloud compatibility mode
 * @return {string} - Commerce Cloud compatibility mode
 */
function getCommerceCloudVersion() {
    return dw.system.System.getCompatibilityMode().toString();
}

/**
 * Gets TaxJar cartridge version
 * @return {string} - TaxJar cartridge version
 */
function getTaxJarCartridgeVersion() {
    return 'int_taxjar/' + dw.web.Resource.msg('taxjar.version.number', 'taxjar', '');
}

/**
 * Gets the full user agent header for requests to TaxJar
 * @return {string} - user agent header string for requests to TaxJar
 */
function getUserAgentHeader() {
    return 'TaxJar/SFCC (Salesforce Commerce Cloud ' + getCommerceCloudVersion() + '; ' + getStorefrontVersion() + ') ' + getTaxJarCartridgeVersion();
}

/**
 * Gets the X API Version of the TaxJar API to use
 * @return {string} - X API Version
 */
function getXAPIVersionHeader() {
    return dw.web.Resource.msg('taxjar.api.version', 'taxjar', '');
}

/**
 * Create TaxJar API service
 *
 * @param  {string} endpoint - Endpoint of TaxJar SmartCalcs API to send request
 * @param  {string} requestType - Type of request (POST or GET)
 * @return {undefined}
 */
function createService(endpoint, requestType) {
    service = LocalServiceRegistry.createService('taxjar.http.api', {
        createRequest: function (svc, requestObj) {
            if (dw.system.System.getInstanceType() == dw.system.System.PRODUCTION_SYSTEM) {
                svc.setCredentialID('taxjar.api.token');
            } else {
                svc.setCredentialID('sandbox.taxjar.api.token');
            }
            var configuration = svc.getConfiguration();
            var url = configuration.getCredential().getURL() + endpoint;
            var apiToken = dw.system.Site.current.getCustomPreferenceValue('TaxJarAPIToken');
            if (!apiToken) {
                apiToken = configuration.getCredential().getPassword();
            }

            svc.addHeader('Content-Type', 'application/json');
            svc.setRequestMethod(requestType);
            svc.addHeader('Authorization', 'Bearer ' + apiToken);
            svc.addHeader('User-Agent', getUserAgentHeader());
            svc.addHeader('x-api-version', getXAPIVersionHeader());
            svc.setURL(url);
            return requestObj;
        },
        parseResponse: function (HTTPService, response) {
            return response;
        },
        filterLogMessage: function (msg) {
            return msg.replace(/to_street":".*?"/, 'to_street":"***"');
        }
    });

    return service;
}

/**
 * Filters personal identification information from logs
 *
 * @param  {Object} response - Response from web service request
 * @return {string} - Filtered and stringified response
 */
function filterTaxJarRequest(response) {
    var data = JSON.parse(response);
    if (data.to_street) {
        data.to_street = '****';
    }

    return JSON.stringify(data);
}

/**
 * Requests tax data from TaxJar SmartCals API
 *
 * @param  {Object} body - Body of request
 * @return {Object|false} Response from SmartCalcs API or false if unsuccessful
 */
function getTaxes(body) {
    createService('/v2/taxes', 'POST');
    Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').debug('Tax data requested from TaxJar API, request: ' + filterTaxJarRequest(body));
    var response = service.call(body);

    if (!response.isOk()) {
        var errorData = {
            code: response.getError(),
            message: response.getErrorMessage(),
            extra_message: response.getMsg(),
            unavailable_reason: response.getUnavailableReason()
        };
        Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').error('TaxJar get taxes API request failed: ' + JSON.stringify(errorData));
        return false;
    }

    Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').debug('Request Successful, Response: ' + response.object.text);

    return response;
}

/**
 * Requests nexus data from TaxJar
 *
 * @return {Object|null} - Response from TaxJar or null if unsuccessful
 */
function getNexus() {
    createService('/v2/nexus/regions', 'GET');
    Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').debug('TaxJar getNexus Requested');
    var response = service.call();

    if (response.isOk()) {
        Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').debug('TaxJar getNexus Response: ' + response.object.text);
        return response.getObject().text;
    }
    var errorData = {
        code: response.getError(),
        message: response.getErrorMessage(),
        extra_message: response.getMsg(),
        unavailable_reason: response.getUnavailableReason()
    };
    Logger.getLogger('TaxJar-Tax-Calculation', 'TaxJar').error('TaxJar Error Getting Nexus: ' + JSON.stringify(errorData));
    return null;
}

/**
 * Creates transaction record in Taxjar
 *
 * @param  {Object} body - Body of request
 * @return {dw.svc.Result} - Result of http request to TaxJar
 */
function createOrderTransaction(body) {
    var bodyObject = JSON.parse(body);
    createService('/v2/transactions/orders', 'POST');
    Logger.getLogger('TaxJar-Transaction-Sync', 'TaxJar').debug('[TaxJar Transaction #' + bodyObject.transaction_id + '] Create Order Request: ' + filterTaxJarRequest(body));
    return service.call(body);
}

/**
 * Updates transaction record in Taxjar
 *
 * @param  {Object} body - Body of the request
 * @return {dw.svc.Result} - Result of http request to TaxJar
 */
function updateOrderTransaction(body) {
    var bodyObject = JSON.parse(body);
    createService('/v2/transactions/orders/' + bodyObject.transaction_id, 'PUT');
    Logger.getLogger('TaxJar-Transaction-Sync', 'TaxJar').debug('[TaxJar Transaction #' + bodyObject.transaction_id + '] Update Order Request: ' + filterTaxJarRequest(body));
    return service.call(body);
}

/**
 * Deletes transaction from TaxJar
 * @param  {string} transactionID - ID of the order to delete
 * @return {dw.svc.Result} - Result of http request to TaxJar
 */
function deleteOrderTransaction(transactionID) {
    createService('/v2/transactions/orders/' + transactionID, 'DELETE');
    Logger.getLogger('TaxJar-Transaction-Sync', 'TaxJar').debug('[TaxJar Transaction #' + transactionID + '] Delete Order Request: ' + transactionID);
    var body = JSON.stringify({
        transaction_id: transactionID,
        provider: 'sfcc'
    });
    return service.call(body);
}

/**
 * Creates refund record in Taxjar
 *
 * @param  {Object} body - Body of request
 * @return {dw.svc.Result} - Result of http request to TaxJar
 */
function createRefund(body) {
    var bodyObject = JSON.parse(body);
    createService('/v2/transactions/refunds', 'POST');
    Logger.getLogger('TaxJar-Transaction-Sync', 'TaxJar').debug('[TaxJar Transaction #' + bodyObject.transaction_id + '] Create Refund Request: ' + filterTaxJarRequest(body));
    return service.call(body);
}

/**
 * Updates refund record in Taxjar
 *
 * @param  {Object} body - Body of the request
 * @return {dw.svc.Result} - Result of http request to TaxJar
 */
function updateRefund(body) {
    var bodyObject = JSON.parse(body);
    createService('/v2/transactions/refunds/' + bodyObject.transaction_id, 'PUT');
    Logger.getLogger('TaxJar-Transaction-Sync', 'TaxJar').debug('[TaxJar Transaction #' + bodyObject.transaction_id + '] Update Refund Request: ' + filterTaxJarRequest(body));
    return service.call(body);
}

/**
 * Deletes refund from TaxJar
 * @param  {string} transactionID - ID of the order to delete
 * @return {dw.svc.Result} - Result of http request to TaxJar
 */
function deleteRefund(transactionID) {
    createService('/v2/transactions/refunds/' + transactionID, 'DELETE');
    Logger.getLogger('TaxJar-Transaction-Sync', 'TaxJar').debug('[TaxJar Transaction #' + transactionID + '] Delete Refund Request: ' + transactionID);
    var body = JSON.stringify({
        transaction_id: transactionID,
        provider: 'sfcc'
    });
    return service.call(body);
}

/**
 * Checks to see if TaxJar API request was successful
 * @param  {dw.svc.Result} result - result of http service call
 * @return {boolean} - true when request to TaxJar was successful
 */
function isRequestSuccessful(result) {
    var isSuccessful = true;

    if (!result.isOk()) {
        isSuccessful = false;
    }
    return isSuccessful;
}

/**
 * Checks to see if create request to TaxJar api resulted in 422 (record already exists) error
 * @param  {dw.svc.Result} result - result of http service call
 * @return {boolean} - true when request to TaxJar resulted in 422 error
 */
function isCreateRequestForAlreadyExistingRecord(result) {
    var isCreateRequestForExistingRecord = false;

    if (!result.isOk()) {
        if (result.getError() === 422) {
            isCreateRequestForExistingRecord = true;
        }
    }

    return isCreateRequestForExistingRecord;
}

/**
 * Checks to see if update request to TaxJar api resulted in 404 (record not found) error
 * @param  {dw.svc.Result} result - result of http service call
 * @return {boolean} - true when request to TaxJar resulted in 404 not found error
 */
function isRecordNotFoundForUpdateRequest(result) {
    var recordNotFound = false;

    if (!result.isOk()) {
        if (result.getError() === 404) {
            recordNotFound = true;
        }
    }

    return recordNotFound;
}

module.exports = {
    getTaxes: getTaxes,
    getNexus: getNexus,
    createOrderTransaction: createOrderTransaction,
    updateOrderTransaction: updateOrderTransaction,
    deleteOrderTransaction: deleteOrderTransaction,
    createRefund: createRefund,
    updateRefund: updateRefund,
    deleteRefund: deleteRefund,
    isRequestSuccessful: isRequestSuccessful,
    isCreateRequestForAlreadyExistingRecord: isCreateRequestForAlreadyExistingRecord,
    isRecordNotFoundForUpdateRequest: isRecordNotFoundForUpdateRequest,
    getUserAgentHeader: getUserAgentHeader,
    createService: createService,
    getXAPIVersionHeader: getXAPIVersionHeader
};
