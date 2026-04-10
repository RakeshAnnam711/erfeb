'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger');

var orderEventService = LocalServiceRegistry.createService('orderEventITPF', {
    createRequest: function (svc, payload) {
        svc.setRequestMethod('POST');
        svc.addHeader('Content-Type', 'application/json');
        svc.addHeader('x-api-key', 'YdB03uAiZLxcpWhKq5RJeg');
        
        Logger.info('orderEventService - Sending payload: {0}', JSON.stringify(payload));
        return JSON.stringify(payload);
    },

    parseResponse: function (svc, response) {
        var parsed = null;
    
        Logger.info('orderEventService - Raw Response: status={0}, text={1}', response.statusCode, response.text);
    
        try {
            parsed = JSON.parse(response.text);
        } catch (e) {
            Logger.error('orderEventService - JSON parse failed. Error: {0}', e.message);
            return {
                ok: false,
                statusCode: response.statusCode,
                errorMessage: 'Invalid JSON response: ' + e.message,
                object: null
            };
        }
    
        var success = response.statusCode === 200 || response.statusCode === 201;
    
        if (success) {
            Logger.info('orderEventService - Success: {0}', JSON.stringify(parsed));
            return {
                ok: true,
                statusCode: response.statusCode,
                object: parsed
            };
        } else {
            Logger.error('orderEventService - Non-success status {0}: {1}', response.statusCode, JSON.stringify(parsed));
            return {
                ok: false,
                statusCode: response.statusCode,
                errorMessage: parsed.message || 'Unexpected error from ITPF',
                object: parsed
            };
        }
    },
    

    mockCall: function (svc, payload) {
        Logger.warn('orderEventService - Mocking response');
        return {
            statusCode: 201,
            ok: true,
            object: {
                code: 'ITPF_SFCC_ORDER_UPDATE_S_001',
                status: 201,
                message: 'SFCC order update event forwarded successfully!',
                data: { status: 'In Progress' }
            }
        };
    }
});

module.exports = orderEventService;
