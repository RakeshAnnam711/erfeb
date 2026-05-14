/* eslint-disable no-console */
var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');

describe('VERTEX: *** controller:VertexEndpoint *** endpoint:DeleteRequest ***', function () {
    this.timeout(5000);

    it('401 response with POST DELETE "UNATHORIZED"', function () {
        var cookieJar = request.jar();
        var myRequest = {
            url: config.baseUrl + '/VertexEndpoint-DeleteRequest',
            method: 'POST',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            body: {
                transaction: 'test',
                source: 'tetsSource'
            },
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'x-vertex-hmac': 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8'
            },
            json: true
        };
        return request(myRequest)
            .then(function (response) {
                assert.equal(response.statusCode, 200);
                var jsonResponse = JSON.parse(response.body);
                console.log(response.body);
                assert.isObject(jsonResponse);
            })
            .catch(function (response) {
                assert.equal(response.statusCode, 401);
                console.log(response.error);
            });
    });

    it('400 response with POST DELETE "EMPTY REQUEST"', function () {
        var cookieJar = request.jar();
        var myRequest = {
            url: config.baseUrl + '/VertexEndpoint-DeleteRequest',
            method: 'POST',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            form: {
                transaction: 'test',
                source: 'tetsSource'
            },
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'x-vertex-hmac': 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8'
            },
            json: true
        };
        return request(myRequest)
            .then(function (response) {
                assert.equal(response.statusCode, 200);
                var jsonResponse = JSON.parse(response.body);
                console.log(response.body);
                assert.isObject(jsonResponse);
            })
            .catch(function (response) {
                assert.equal(response.statusCode, 400);
                console.log(response.error);
            });
    });
});
