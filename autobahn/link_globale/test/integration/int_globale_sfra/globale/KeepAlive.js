'use strict';

var assert = require('chai').assert;
var request = require('request-promise');
var config = require('./globale.config');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);

/**
 * Test case:
 * endpoint should be available
 */

describe('KeepAlive', function () {
    this.timeout(10000);

    describe('positive test', function () {
        it('Global-e KeepAlive: endpoint should be available and return response object.', function () {
            var cookieJar = request.jar();

            var myRequest = {
                url: '',
                method: 'GET',
                rejectUnauthorized: false,
                resolveWithFullResponse: true,
                jar: cookieJar,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };

            var keepAliveDataUrl = 'Globale-KeepAlive';

            myRequest.url = config.baseUrl + keepAliveDataUrl;

            return request(myRequest)
                .then(function (resp) {
                    var jsonResponse = JSON.parse(resp.body);
                    assert.equal(resp.statusCode, 200, 'Expected KeepAlive request statusCode to be 200.');
                    assert.property(jsonResponse, 'success', 'Expected KeepAlive response to contain \'success\' property.');
                });
        });
    });
});
