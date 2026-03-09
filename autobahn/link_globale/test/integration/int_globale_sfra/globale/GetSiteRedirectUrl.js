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

describe('GetSiteRedirectUrl', function () {
    this.timeout(10000);

    describe('positive test', function () {
        it('Global-e GetSiteRedirectUrl: endpoint should be available and return redirect URL if available.', function () {
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

            var getSiteRedirectUrl = 'Globale-GetSiteRedirectUrl';

            myRequest.url = config.baseUrl + getSiteRedirectUrl + '?countryCode=AU';

            return request(myRequest)
                .then(function (resp) {
                    var jsonResponse = JSON.parse(resp.body);
                    assert.equal(resp.statusCode, 200, 'Expected GetSiteRedirectUrl request statusCode to be 200.');
                    assert.isObject(jsonResponse, 'apiVersion', 'Expected GetSiteRedirectUrl response to be an object.');
                });
        });
    });
});
