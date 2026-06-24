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

describe('ScriptLoaderData', function () {
    this.timeout(10000);

    describe('positive test', function () {
        it('Global-e ScriptLoaderData: endpoint should be available and return configuration object.', function () {
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

            var scriptLoaderDataUrl = 'Globale-ScriptLoaderData';

            myRequest.url = config.baseUrl + scriptLoaderDataUrl;

            return request(myRequest)
                .then(function (resp) {
                    var jsonResponse = JSON.parse(resp.body);
                    assert.equal(resp.statusCode, 200, 'Expected ScriptLoaderData request statusCode to be 200.');
                    assert.property(jsonResponse, 'apiVersion', 'Expected ScriptLoaderData response to contain \'apiVersion\' property.');
                });
        });
    });
});
