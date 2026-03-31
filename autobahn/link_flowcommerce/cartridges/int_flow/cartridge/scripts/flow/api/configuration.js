'use strict';

var actions = require('*/cartridge/scripts/flow/api/actions');

var shippingConfigStore = {};

/**
 * Shipping Tier resolver function. Creates the shipping tier models from the Api call result.
 * @param {Object} result - The result object of the service call.
 * @returns {Array} Array of ShippingTierModel objects
 */
function shippingTiersResolver(result) {
    var ShippingTierModel = require('*/cartridge/scripts/flow/models/shippingTierModel');

    var tiers = [];
    var key = result.key;
    var shippingLanes = result.shipping_lanes || [];

    shippingLanes.forEach(function (lane) {
        var shippingTiers = lane.tiers || [];

        if (lane.direction === 'outbound') {
            tiers = tiers.concat(shippingTiers.map(function (tier) {
                return new ShippingTierModel(tier);
            }));
        }
    });

    if (tiers.length && key) {
        shippingConfigStore[key] = tiers;
    }

    return tiers;
}

/**
 * Default Resolver of a Flow API call
 * @param {Object} result - The result object of the service call.
 * @returns {Object} Mirrors back the incoming Object
 */
function defaultResolver(result) {
    return result || null;
}

/**
 * Class that handles the Configuration Api Requests
 * @param {Function} makeRequest - function that performs a Flow Api request
 * @constructor
 */
function ConfigurationApi(makeRequest) {
    this.makeRequest = makeRequest;
}

/**
 * Get the shipping tiers for this shipping lane from the Flow Api
 * @param {string} shippingConfigKey - Shipping Configuration Key
 * @returns {Array} Array of ShippingTierModel objects
 */
ConfigurationApi.prototype.getShippingTiers = function (shippingConfigKey) {
    return shippingConfigStore[shippingConfigKey] ? shippingConfigStore[shippingConfigKey] : this.makeRequest(actions.getShippingConfiguration, {
        key: shippingConfigKey
    }, null, shippingTiersResolver);
};

/**
 * Get the region configuration for a given region from the Flow Api
 * @param {string} region - The region id
 * @returns {Object} Flow Region Object
 */
ConfigurationApi.prototype.getRegion = function (region) {
    return this.makeRequest(actions.getRegion, {
        region: region
    }, null, defaultResolver);
};

module.exports = ConfigurationApi;
