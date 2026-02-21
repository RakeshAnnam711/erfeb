'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');

var adpxService = LocalServiceRegistry.createService('ADPX-feed', {
    createRequest: function (svc, params) {
        svc.setRequestMethod('POST');
        svc.addHeader('Content-Type', 'application/json');
        svc.addHeader('x-api-key', 'YdB03uAiZLxcpWhKq5RJeg');

        return JSON.stringify({
            event_id: params.event_id,
            batch_id: params.batch_id,
            updated_at: params.updated_at
        });
    },

    parseResponse: function (svc, client) {
        try {
            var response = JSON.parse(client.text);

            Logger.info('ADPX response code: ' + response.code);
            Logger.info('ADPX message: ' + response.message);
            Logger.info('ADPX status: ' + (response.data && response.data.status));

            return {
                success: client.statusCode === 200 || client.statusCode === 201,
                code: response.code,
                message: response.message,
                status: response.data ? response.data.status : null,
                raw: response
            };
        } catch (e) {
            Logger.error('Error parsing ADPX response: ' + e.message);
            return {
                success: false,
                error: 'invalid_response',
                message: e.message
            };
        }
    },

    getRequestLogMessage: function (request) {
        return 'ADPX Request: ' + request;
    },

    getResponseLogMessage: function (response) {
        return 'ADPX Response: ' + JSON.stringify(response);
    },

    mockCall: function (svc, params) {
        return {
            statusCode: 201,
            statusMessage: 'Mocked',
            text: JSON.stringify({
                code: 'ITPF_SFCC_ADPX_FEED_UPDATE_S_001',
                status: 201,
                message: 'Mocked ADPX feed update event forwarded successfully!',
                data: {
                    status: 'In Progress'
                }
            })
        };
    }
});

module.exports = {
    sendFeedUpdate: function (payload) {
        try {
            var result = adpxService.call(payload);
            if (result.ok && result.object && result.object.success) {
                Logger.info('ADPX update successful Batch: ' + payload.batch_id);
                return result.object;
            } else {
                Logger.error('ADPX update failed ' + result.errorMessage || JSON.stringify(result));
                return null;
            }
        } catch (e) {
            Logger.error('Exception calling ADPX service: ' + e.message);
            return null;
        }
    }
};
