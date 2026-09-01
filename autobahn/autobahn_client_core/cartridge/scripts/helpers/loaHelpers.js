'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Site = require('dw/system/Site');

/**
 * @return {Object} - The Zonos Order Complete service
 */

function loaService() {
    var service = LocalServiceRegistry.createService('loa.api', {
        /**
         * Verify the authorization args.
         *
         * @param {Object} svc - svc
         * @param {Object} args - arguments needed for authorization
         * @returns {Object} jsonReq - returns request.
         */
        createRequest: function (svc, args) {
            svc.addHeader('Content-Type', 'application/json');
            svc.setURL(svc.getURL() + args)
            svc.setRequestMethod('GET');

            if (args) {
                return true;
            } else {
                return false;
            }
        },
        parseResponse: function (svc, client) {
            return client;
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });

    return service;
}

module.exports = {
    loaService: loaService
}
