/* eslint-disable no-console */
var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');

describe('VERTEX: VERTEX: *** controller:VertexEndpoint ***  endpoint:SelectVertexAddress ***', function () {
    this.timeout(5000);

    it('200 response with POST SelectVertexAddress', function () {
        var cookieJar = request.jar();
        var myRequest = {
            url: config.baseUrl + '/VertexEndpoint-SelectVertexAddress',
            method: 'POST',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            form: {
                requestBody: { test: 'test' }
            },
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };
        return request(myRequest)
            .then(function (response) {
                assert.equal(response.statusCode, 200);
                var jsonResponse = JSON.parse(response.body);
                console.log(response.body);
                assert.isObject(jsonResponse);
            });
    });
});
