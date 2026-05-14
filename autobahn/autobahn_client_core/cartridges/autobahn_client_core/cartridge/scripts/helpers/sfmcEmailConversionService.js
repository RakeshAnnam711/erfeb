'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Encoding = require('dw/crypto/Encoding');

/**
 * @return {Object} - send data to SFMC for email conversion
 */
function sfmcEmailConversionService() {
    var service = LocalServiceRegistry.createService('marketing.cloud.email.conversion', {
        createRequest: function (svc, xmlData) {
            svc.addHeader('Content-Type', 'application/xml');
            var apiURL = svc.getURL();
            apiURL=apiURL+Encoding.toURI(xmlData);
            svc.setURL(apiURL);
            svc.setRequestMethod('GET');
            if (xmlData) {
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
    sfmcEmailConversionService: sfmcEmailConversionService
}
