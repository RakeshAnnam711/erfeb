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

describe('Analytics', function () {
    this.timeout(10000);

    describe('positive test', function () {
        it('Global-e Analytics: endpoint should be available and return response object.', function () {
            var cookieJar = request.jar();

            var myRequest = {
                url: '',
                method: 'POST',
                rejectUnauthorized: false,
                resolveWithFullResponse: true,
                jar: cookieJar,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                json: true
            };

            var analyticsUrl = 'Globale-Analytics';

            myRequest.url = config.baseUrl + analyticsUrl;
            myRequest.body = {
                StepId: 1,
                Steps: {
                    LOADED: 1
                }
            };

            return request(myRequest)
                .then(function (resp) {
                    var jsonResponse = resp.body;
                    assert.equal(resp.statusCode, 200, 'Expected Analytics request statusCode to be 200.');
                    assert.property(jsonResponse, 'action', 'Expected Analytics response to contain \'action\' property.');
                    assert.property(jsonResponse, 'success', 'Expected Analytics response to contain \'success\' property.');
                });
        });
    });
});
