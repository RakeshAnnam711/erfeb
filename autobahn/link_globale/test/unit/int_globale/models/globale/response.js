'use strict';

var mockFactories = require('../../../../mock/factories/index');
var assert = require('chai').assert;
var response = mockFactories.models.globale.response;

describe('models/globale/response.js', function () {
    it('should be an object', function () {
        assert.isObject(response);
    });
});
