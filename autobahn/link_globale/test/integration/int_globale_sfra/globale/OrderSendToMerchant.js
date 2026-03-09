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

describe('OrderSendToMerchant', function () {
    this.timeout(10000);

    describe('positive test', function () {
        it('Global-e orderSendToMerchant: endpoint should be available.', function () {
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

            var finalizeUrl = 'Globale-OrderSendToMerchant';

            myRequest.url = config.baseUrl + finalizeUrl;
            myRequest.form = {};

            return request(myRequest)
                .then(
                    function () {},
                    function (orderSendToMerchant) {
                        var jsonResponse = JSON.parse(orderSendToMerchant.response.body);
                        assert.equal(orderSendToMerchant.statusCode, 400, 'Expected orderSendToMerchant request statusCode to be 400.');
                        assert.equal(jsonResponse.Success, false);
                    }
                );
        });
    });
});
