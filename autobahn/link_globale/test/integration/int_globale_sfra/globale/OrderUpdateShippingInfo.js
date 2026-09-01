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

describe('OrderUpdateShippingInfo', function () {
    this.timeout(10000);

    describe('positive test', function () {
        it('Global-e OrderUpdateShippingInfo: endpoint should be available and return response object.', function () {
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

            var orderUpdateShippingInfoUrl = 'Globale-OrderUpdateShippingInfo';

            myRequest.url = config.baseUrl + orderUpdateShippingInfoUrl;

            return request(myRequest)
                .then(
                    function () {},
                    function (resp) {
                        var jsonResponse = resp.response.body;
                        assert.equal(resp.statusCode, 400, 'Expected OrderUpdateShippingInfo request statusCode to be 400.');
                        assert.property(jsonResponse, 'action', 'Expected OrderUpdateShippingInfo response to contain \'action\' property.');
                        assert.property(jsonResponse, 'Success', 'Expected OrderUpdateShippingInfo response to contain \'Success\' property.');
                    }
                );
        });
    });
});
