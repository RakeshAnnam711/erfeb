'use strict';

module.exports = function (serviceName) {
    var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
    return LocalServiceRegistry.createService(serviceName, {
        createRequest: function (svc, params) {
            return params;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });
};
