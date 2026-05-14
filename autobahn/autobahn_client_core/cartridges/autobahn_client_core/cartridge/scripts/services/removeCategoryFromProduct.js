'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger');
var Bytes = require('dw/util/Bytes');
var Encoding = require('dw/crypto/Encoding');
var HTTPClient = require('dw/net/HTTPClient');

var removeCategoryFromProduct = LocalServiceRegistry.createService('RemoveCategoryFromProduct', {

    createRequest: function (svc, params) {

        var catalogID = params.catalogID;
        var categoryID = params.categoryID;
        var productID = params.productID;

        if (!catalogID || !categoryID || !productID) {
            Logger.error('Missing required parameters');
            return null;
        }

        var cred = svc.getConfiguration().getCredential();

        if (!cred || !cred.getUser() || !cred.getPassword()) {
            Logger.error('Missing or invalid credentials.');
            return null;
        }

        var userPass = cred.getUser() + ':' + cred.getPassword();
        var basicEncoded = Encoding.toBase64(new Bytes(userPass, 'UTF-8'));

        var tokenClient = new HTTPClient();
        tokenClient.open(
            'POST',
            'https://account.demandware.com/dwsso/oauth2/access_token?grant_type=client_credentials'
        );
        tokenClient.setRequestHeader('Authorization', 'Basic ' + basicEncoded);
        tokenClient.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        tokenClient.send();

        if (tokenClient.statusCode !== 200) {
            Logger.error(
                'Token request failed. Status: {0}, Response: {1}',
                tokenClient.statusCode,
                tokenClient.text
            );
            return null;
        }

        var accessToken = JSON.parse(tokenClient.text).access_token;

        var baseURL = svc.getConfiguration().getCredential().getURL(); // safer than svc.getURL()
        var fullURL =
            baseURL +
            '/' + encodeURIComponent(catalogID) +
            '/categories/' + encodeURIComponent(categoryID) +
            '/products/' + encodeURIComponent(productID);

        svc.setURL(fullURL);
        svc.setRequestMethod('DELETE');
        svc.addHeader('Authorization', 'Bearer ' + accessToken);
        svc.addHeader('Content-Type', 'application/json');

        Logger.info('Final URL: ' + fullURL);
        Logger.info(
            'Removing Product {0} from Category {1} in Catalog {2}',
            productID,
            categoryID,
            catalogID
        );

        return null;
    },

    parseResponse: function (svc, response) {

        var success = response.statusCode === 204;

        Logger.info(
            'statusCode: {0}, Response: {1}',
            response.statusCode,
            response.text
        );

        if (!success) {
            Logger.error(
                'Failed to remove category. Status: {0}, Response: {1}',
                response.statusCode,
                response.text
            );
        }

        return {
            ok: success,
            statusCode: response.statusCode
        };
    }

});

module.exports = removeCategoryFromProduct;