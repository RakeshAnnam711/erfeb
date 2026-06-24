'use strict';

var actions = require('*/cartridge/scripts/flow/api/actions');

/**
 * Default Resolver of a Flow API call
 * @param {Object} result - The result object of the service call.
 * @returns {Object} Mirrors back the incoming Object
 */
function defaultResolver(result) {
    return result || null;
}

/**
 * Class that handles the Experience Api Requests
 * @param {Function} makeRequest - function that performs a Flow Api request
 * @constructor
 */
function ExperienceApi(makeRequest) {
    this.makeRequest = makeRequest;
}

/**
 * Get the experiences for this organization from the Flow Api
 * @returns {Array} Array of Flow Experience objects
 */
ExperienceApi.prototype.getExperiences = function () {
    return this.makeRequest(actions.getExperiences, null, null, defaultResolver);
};

/**
 * Get the pricing object for an experience id
 * @param {string} experience - Experience Id
 * @returns {Object} Pricing object
 */
ExperienceApi.prototype.getPricing = function (experience) {
    return this.makeRequest(actions.getExperiencePricing, {
        experience: experience
    }, null, defaultResolver);
};

/**
 * Get the display payment methods for an experience id
 * @param {string} experience - Experience Id
 * @returns {Object} Delivery Window object
 */
ExperienceApi.prototype.getPaymentMethods = function (experience) {
    return this.makeRequest(actions.getPaymentMethods, {
        experience: experience
    }, null, defaultResolver);
};

module.exports = ExperienceApi;
