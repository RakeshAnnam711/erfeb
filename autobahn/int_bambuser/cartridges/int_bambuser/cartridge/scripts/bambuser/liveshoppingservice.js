'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

/**
 * @returns {Object} available shows
 */
function getShows() {
    var service = LocalServiceRegistry.createService('int_bambuser.live-shopping', {
        /**
         * Create request for service authentication
         * @param {HTTPService} svc service
         */
        createRequest: function (svc) {
            var requestURL = svc.getURL() + '/shows/';

            svc
                .setAuthentication('NONE')
                .setRequestMethod('GET')
                .addHeader('Accept', 'application/json')
                .addHeader('Authorization', 'Token ' + svc.configuration.credential.custom.apiKey)
                .setURL(requestURL);
        },

        /**
         * @param {HTTPService} svc service
         * @param {HTTPClient} client lient
         * @returns {Object} parsed response object
         */
        parseResponse: function (svc, client) {
            var result = JSON.parse(client.text);

            return result;
        },

        /**
         * mock, required for logging
         * @param {string} msg msg
         * @returns {string} msg
         */
        filterLogMessage: function (msg) {
            return msg;
        }
    });
    var res = service.call();
    if (res && res.object && res.object.results) {
        return res.object.results;
    }
    dw.system.Logger.error('Bad response:\n{0}', res);
    return [];
}

module.exports = {
    getShows: getShows
};
