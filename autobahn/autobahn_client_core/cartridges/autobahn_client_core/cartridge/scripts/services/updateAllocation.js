'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger');
var Bytes = require('dw/util/Bytes');
var Encoding = require('dw/crypto/Encoding');
var HTTPClient = require('dw/net/HTTPClient');

var updateAllocation = LocalServiceRegistry.createService('UpdateInventoryAllocation', {
    createRequest: function (svc, params) {
        var productID = params.productID;
        var cred = svc.getConfiguration().getCredential();
        var user = cred ? cred.getUser() : null;
        var pass = cred ? cred.getPassword() : null;
        var userPass = user + ':' + pass;
        var basicEncoded = Encoding.toBase64(new Bytes(userPass, 'UTF-8'));
        var http = new HTTPClient();
        http.setTimeout(5000);
        http.open('POST', 'https://account.demandware.com/dwsso/oauth2/access_token?grant_type=client_credentials');
        http.setRequestHeader('Authorization', 'Basic ' + basicEncoded);
        http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        http.send();
        var accessToken = null;
        if (http.statusCode === 200) {
            try {
                accessToken = JSON.parse(http.text).access_token;
            } catch (e) {
                Logger.error('updateAllocation - Failed to parse token response: {0}', e.message);
            }
        } else {
            Logger.error('updateAllocation - Token request failed. Status: {0}, Response: {1}', http.statusCode, http.text);
        }

        if (!accessToken) {
            Logger.error('updateAllocation - No access token retrieved, aborting call.');
            return null;
        }
        var baseURL = svc.URL;
        if (productID) {
            baseURL = baseURL + '/' + encodeURIComponent(productID);
        }
        svc.setURL(baseURL);
        
        svc.setRequestMethod('PUT');
        svc.addHeader('Authorization', 'Bearer ' + accessToken);
        svc.addHeader('Content-Type', 'application/json');
        
        Logger.info('updateAllocation - Sending request for productID: {0}', productID);
        return JSON.stringify({
            allocation: {
                amount: 0
            }
        });
        
    },

    parseResponse: function (svc, response) {
        try {
            var parsed = JSON.parse(response.text);
            if (parsed.product_id) {
                Logger.info(
                    'updateAllocation - Response for product {0}: allocation={1}, ats={2}, link={3}',
                    parsed.product_id,
                    parsed.allocation ? parsed.allocation.amount : 'N/A',
                    parsed.ats,
                    parsed.link
                );
            }
    
            return {
                ok: response.statusCode === 200 || response.statusCode === 201,
                statusCode: response.statusCode,
                object: parsed
            };
        } catch (e) {
            Logger.error('updateAllocation - parseResponse error: {0}', e.message);
            return {
                ok: false,
                statusCode: response.statusCode,
                errorMessage: 'Invalid JSON: ' + e.message,
                object: null
            };
        }
    }
    
});

module.exports = updateAllocation;
