'use strict';

var actions = require('*/cartridge/scripts/flow/api/actions');
var DeliveryWindowModel = require('*/cartridge/scripts/flow/models/deliveryWindowModel');

/**
 * Delivery Window Resolver, converts the api response to a Delivery Window Model Object
 * @param {Object} result - The result object of the service call.
 * @returns {DeliveryWindowModel} Delivery Window Model
 */
function deliveryWindowResolver(result) {
    return new DeliveryWindowModel(result);
}

/**
 * Class that handles the Shipping Api Requests
 * @param {Function} makeRequest - function that performs a Flow Api request
 * @constructor
 */
function ShippingApi(makeRequest) {
    this.makeRequest = makeRequest;
}

/**
 * Get the delivery window for a given origin and destination
 * @param {string} origin - Origin country code
 * @param {string} destination - Destination country code
 * @returns {Object} Delivery Window object
 */
ShippingApi.prototype.getDeliveryWindow = function (origin, destination) {
    return this.makeRequest(actions.getDeliveryWindow, {
        origin: origin,
        destination: destination
    }, null, deliveryWindowResolver);
};

module.exports = ShippingApi;
