'use strict';

const prefs = require('*/cartridge/config/preferences');
const utils = require('*/cartridge/scripts/paypal/utils');

const BASKETS_URL_STRING = '/baskets/';
const SHIPMENTS_URL_STRING = '/shipments/';

/**
 * Returns OCAPI version
 * @returns {string} OCAPI version
 */
function getVersion() {
    return ['v', prefs.ocapiConfig.apiVersion.replace('.', '_')].join('');
}

/**
 * Returns the formatted url for provided resource
 * @param {string} resource The resource to be called
 * @returns {string} Formatted resource url
 */
function generateBaseUrl(resource) {
    const site = require('dw/system/Site').current;

    return ['https://', request.httpHost, '/s/', site.ID, '/dw/shop/', getVersion(), resource].join('');
}

/**
 * Constructs a helper to communicate with OCAPI through the HTTPClient
 */
function HttpClientOcapi() {
    const HTTPClient = require('dw/net/HTTPClient');

    this.httpClientInstance = new HTTPClient();
    this.jwt = null;
}

/**
 * Creates error log and throws an error
 */
HttpClientOcapi.prototype.handleError = function() {
    if (this.httpClientInstance.statusCode !== 200) {
        const paypalUtils = require('~/cartridge/scripts/paypal/utils');

        const error = utils.tryParseJSON(this.httpClientInstance.errorText);

        paypalUtils.createErrorLog(error.fault.message);

        throw new Error(error.fault.message);
    }
};

/**
 * Creates session bridge for provided customer session
 * @param {string} sessionId The session id
 * @param {string} tokenData JSON data of dwsecuretoken
 */
HttpClientOcapi.prototype.initJWTForSession = function(sessionId, tokenData) {
    const constants = require('~/cartridge/config/constants');

    const CUSTOMER_AUTH_RESOURCE = '/customers/auth';
    const body = JSON.stringify({
        type: 'session'
    });

    this.httpClientInstance.open('POST', generateBaseUrl(CUSTOMER_AUTH_RESOURCE));

    this.httpClientInstance.setTimeout(3000);
    this.httpClientInstance.setRequestHeader('Content-Type', 'application/json');
    this.httpClientInstance.setRequestHeader('x-dw-client-id', prefs.ocapiConfig.clientId);

    let cookies = [constants.DWSID, '=', sessionId].join('');

    if (tokenData) {
        const parsedTokenData = utils.tryParseJSON(tokenData);

        cookies = [cookies, ';', parsedTokenData.name, '=', parsedTokenData.value].join('');
    }

    this.httpClientInstance.setRequestHeader('Cookie', cookies);
    this.httpClientInstance.send(body);

    this.handleError();

    this.jwt = this.httpClientInstance.getResponseHeader('authorization');
};

/**
 * Creates a "GET" request to the provided resource
 * @param {string} resource The resource to be called
 * @returns {Object} Parsed data from the endpoint
 */
HttpClientOcapi.prototype.get = function(resource) {
    this.httpClientInstance.open('GET', generateBaseUrl(resource));

    this.httpClientInstance.setTimeout(3000);
    this.httpClientInstance.setRequestHeader('Authorization', this.jwt);

    this.httpClientInstance.send();

    this.handleError();

    return utils.tryParseJSON(this.httpClientInstance.text);
};

/**
 * Creates a "PUT" request to the provided resource
 * @param {string} resource The resource to be called
 * @param {Object} data Data to be passed in request for update
 * @returns {Object} Parsed data from the endpoint
 */
HttpClientOcapi.prototype.put = function(resource, data) {
    const body = JSON.stringify(data);

    this.httpClientInstance.open('PUT', generateBaseUrl(resource));

    this.httpClientInstance.setTimeout(3000);
    this.httpClientInstance.setRequestHeader('Authorization', this.jwt);

    this.httpClientInstance.send(body);

    this.handleError();

    return utils.tryParseJSON(this.httpClientInstance.text);
};

/**
 * Returns basket data by provided basket UUID
 * @param {string} basketId Basket UUID
 * @returns {Object} Basket data object
 */
HttpClientOcapi.prototype.getBasket = function(basketId) {
    const BASKET_GET_RESOURCE = BASKETS_URL_STRING + basketId;

    return this.get(BASKET_GET_RESOURCE);
};

/**
 * Returns applicable shipping methods of the basket
 * @param {string} basketId Basket id
 * @param {string} shipmentId Shipment id from the basket
 * @returns {Object} Applicable shipping methods data
 */
HttpClientOcapi.prototype.getBasketApplicableShippingMethods = function(basketId, shipmentId) {
    const GET_SHIPMENT_SHIPPING_METHODS = [BASKETS_URL_STRING, basketId, SHIPMENTS_URL_STRING, shipmentId, '/shipping_methods'].join('');

    return this.get(GET_SHIPMENT_SHIPPING_METHODS);
};

/**
 * Updates a shipment of basket with new shipping address
 * @param {Object} shippingAddress The new shipping address object
 * @param {string} basketId The id of basket to be updated
 * @param {string} shipmentId The id of shipment to be updated
 * @returns {Object} Basket data
 */
HttpClientOcapi.prototype.updateBasketShippingAddress = function(shippingAddress, basketId, shipmentId) {
    const UPDATE_BASKET_SHIPPING_ADDRESS = [BASKETS_URL_STRING, basketId, SHIPMENTS_URL_STRING, shipmentId, '/shipping_address'].join('');

    return this.put(UPDATE_BASKET_SHIPPING_ADDRESS, shippingAddress);
};

/**
 * Updates a shipment of basket with new shipping method
 * @param {Object} shippingMethod The new shipping address object
 * @param {string} basketId The id of basket to be updated
 * @param {string} shipmentId The id of shipment to be updated
 * @returns {Object} Basket data
 */
HttpClientOcapi.prototype.updateBasketShippingMethod = function(shippingMethod, basketId, shipmentId) {
    const UPDATE_BASKET_SHIPPING_METHOD = [BASKETS_URL_STRING, basketId, SHIPMENTS_URL_STRING, shipmentId, '/shipping_method'].join('');

    return this.put(UPDATE_BASKET_SHIPPING_METHOD, shippingMethod);
};

module.exports = HttpClientOcapi;
