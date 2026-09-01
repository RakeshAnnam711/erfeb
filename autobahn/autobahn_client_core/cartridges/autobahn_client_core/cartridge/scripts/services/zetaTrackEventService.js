'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger').getLogger('Zeta', 'ZetaTrackEvent');

var ZetaTrackEventService = LocalServiceRegistry.createService('ZetaTrackEvent', {

    createRequest: function (svc, params) {
        svc.setRequestMethod('POST');
        svc.addHeader('Content-Type', 'application/json');
        svc.addHeader('Accept', 'application/json');

        if (params.endpoint) {
            svc.setURL(svc.getURL() + params.endpoint);
        }

        var requestBody = JSON.stringify(params.payload || {});
        Logger.info('Zeta Request: {0}', requestBody);

        return requestBody;
    },

    parseResponse: function (svc, response) {
        var statusCode = response.statusCode;

        Logger.info('Zeta Response Status: {0}', statusCode);
        Logger.info('Zeta Response Body: {0}', response.text);

        if (statusCode === 202) {
            return {
                success: true,
                accepted: true,
                statusCode: statusCode,
                message: 'Accepted for processing'
            };
        }
        if (statusCode >= 200 && statusCode < 300) {
            try {
                return {
                    success: true,
                    statusCode: statusCode,
                    data: JSON.parse(response.text)
                };
            } catch (e) {
                return {
                    success: true,
                    statusCode: statusCode,
                    raw: response.text
                };
            }
        }

        return {
            success: false,
            error: true,
            statusCode: statusCode,
            message: response.text
        };
    },

    mockCall: function () {
        return {
            statusCode: 202,
            statusMessage: 'Accepted',
            text: JSON.stringify({
                success: true,
                message: 'Mock accepted'
            })
        };
    }
});

module.exports = ZetaTrackEventService;