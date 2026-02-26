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
 * Class that handles the Payment Api Requests
 * @param {Function} makeRequest - function that performs a Flow Api request
 * @constructor
 */
function SessionApi(makeRequest) {
    this.makeRequest = makeRequest;
}

SessionApi.prototype.createSession = function (country, experienceId) {
    var body = {};

    if (experienceId) {
        body.experience = experienceId;
    } else {
        body.country = country;
    }

    return this.makeRequest(actions.createSession, null, body, defaultResolver);
};

SessionApi.prototype.getSession = function (session) {
    return this.makeRequest(actions.getSession, {
        session: session
    }, null, defaultResolver);
};

module.exports = SessionApi;
