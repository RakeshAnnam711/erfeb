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

describe('OrderCreate', function () {
    this.timeout(10000);

    describe('positive test', function () {
        it('Global-e OrderCreate: endpoint should be available and return response object.', function () {
            var cookieJar = request.jar();

            var myRequest = {
                url: '',
                method: 'POST',
                rejectUnauthorized: false,
                resolveWithFullResponse: true,
                jar: cookieJar,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };

            var orderCreateUrl = 'Globale-OrderCreate';

            myRequest.url = config.baseUrl + orderCreateUrl;

            return request(myRequest)
                .then(
                    function () {},
                    function (resp) {
                        var jsonResponse = JSON.parse(resp.response.body);
                        assert.equal(resp.statusCode, 400, 'Expected OrderCreate request statusCode to be 400.');
                        assert.property(jsonResponse, 'action', 'Expected OrderCreate response to contain \'action\' property.');
                    }
                );
        });
    });
});
