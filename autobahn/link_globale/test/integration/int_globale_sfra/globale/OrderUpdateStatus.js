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

describe('OrderUpdateStatus', function () {
    this.timeout(10000);

    describe('positive test', function () {
        it('Global-e OrderUpdateStatus: endpoint should be available and return response object.', function () {
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

            var orderUpdateStatusUrl = 'Globale-OrderUpdateStatus';

            myRequest.url = config.baseUrl + orderUpdateStatusUrl;

            return request(myRequest)
                .then(
                    function () {},
                    function (resp) {
                        var jsonResponse = resp.response.body;
                        assert.equal(resp.statusCode, 400, 'Expected OrderUpdateStatus request statusCode to be 400.');
                        assert.property(jsonResponse, 'action', 'Expected OrderUpdateStatus response to contain \'action\' property.');
                        assert.property(jsonResponse, 'Success', 'Expected OrderUpdateStatus response to contain \'Success\' property.');
                    }
                );
        });
    });
});
