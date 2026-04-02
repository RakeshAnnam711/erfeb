var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');

describe('Flow-CountryPickerOptions', function () {
    this.timeout(25000);

    var myRequest = {
        url: config.baseUrl + '/Flow-CountryPickerOptions',
        method: 'GET',
        rejectUnauthorized: false,
        resolveWithFullResponse: true
    };

    it('should return a valid json object', function () {
        return request(myRequest)
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Expected country picker options statusCode to be 200.');
                var bodyAsJson = JSON.parse(response.body);

                assert.isTrue(bodyAsJson.options.type === 'modal');
            });
    }); 
});

describe('Flow-InventoryCheck', function () {
    this.timeout(25000);

    var myGetRequest = {
        url: config.baseUrl + '/Flow-InventoryCheck',
        method: 'GET',
        rejectUnauthorized: false,
        resolveWithFullResponse: true
    };

    var myPostRequest = {
        url: config.baseUrl + '/Flow-InventoryCheck',
        method: 'POST',
        json: true,
        body: {"items":[{"id":"640188016624", "qty":1}, {"id":"640188016709", "qty":1}]}
    };

    it('should reject a GET request', function () {
        return request(myGetRequest)
            .then(function (response) {
                assert.notEqual(response.statusCode, 200, 'Expected GET inventory check statusCode to not be 200.');
            }).catch(function (err) {
                assert.notEqual(err.statusCode, 200, 'Expected GET inventory check statusCode to not be 200.');
            });
    });
    
    it('should return a valid inventory check for a inStock product', function () {
        return request(myPostRequest)
            .then(function (response) {
                assert.equal(response.items.length, 2, 'Expected inventory check to return two items');
            });
    });
});
