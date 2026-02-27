'use strict';

var actions = require('*/cartridge/scripts/flow/api/actions');
var store = {}; // Order Cache

/**
 * Flow Order resolver function. Creates the Flow OrderModel object from the result
 * @param {Object} result - The result object of the service call.
 * @returns {OrderModel} The Flow Order
 */
function orderResolver(result) {
    var OrderModel = require('*/cartridge/scripts/flow/models/orderModel');

    return new OrderModel(result);
}

/**
 * Flow Order Allocation resolver function. Creates the Flow OrderAllocationModel object from the result
 * @param {Object} result - The result object of the service call.
 * @returns {OrderAllocationModel} The Flow Order Allocation
 */
function orderAllocationResolver(result) {
    var OrderAllocationModel = require('*/cartridge/scripts/flow/models/orderAllocationModel');

    return new OrderAllocationModel(result);
}

/**
 * Flow Order fraud status resolver
 * @param {Object} result - The result object of the service call.
 * @returns {string} Fraud status value or null.
 */
function fraudCheckResolver(result) {
    return result ? result.status : null;
}

/**
 * Class that handles the Order Api Requests
 * @param {Function} makeRequest - function that performs a Flow Api request
 * @param {boolean} romanizeAddresses - Flag to return romainzed addresses where possible
 * @constructor
 */
function OrderApi(makeRequest, romanizeAddresses) {
    this.makeRequest = makeRequest;
    this.romanizeAddresses = romanizeAddresses;
}

/**
 * Gets the Flow Order by the Flow Order number.
 * Checks the order cache first
 * Stores the OrderModel in the cache on a succesful api call
 * @param {string} number - The Flow Order number
 * @returns {OrderModel} The Flow Order or null
 */
OrderApi.prototype.getOrder = function (number) {
    var order;

    if (store[number]) {
        return store[number];
    }

    if (this.romanizeAddresses) {
        actions.getOrder.uri += '?romanize=all';
    }

    order = this.makeRequest(actions.getOrder, {
        number: number
    }, null, orderResolver);

    if (order) {
        store[number] = order;
    }

    return order;
};

/**
 * Gets the Flow Order Allocation by the Flow Order number
 * @param {string} number - The Flow Order number
 * @returns {OrderAllocationModel} The Flow Order Allocation or null
 */
OrderApi.prototype.getOrderAllocation = function (number) {
    return this.makeRequest(actions.getOrderAllocation, {
        number: number
    }, null, orderAllocationResolver);
};

/**
 * Gets the Fraud Status for a Flow Order
 * @param {string} number - The Flow Order number
 * @returns {string} Fraud status or null
 */
OrderApi.prototype.checkFraudStatus = function (number) {
    return this.makeRequest(actions.checkFraudStatus, {
        number: number
    }, null, fraudCheckResolver);
};

module.exports = OrderApi;
