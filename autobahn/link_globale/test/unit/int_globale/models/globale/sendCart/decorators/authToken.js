'use strict';

var mockFactories = require('../../../../../../mock/factories/index');
var assert = require('chai').assert;

var request = mockFactories.models.globale.request;
var authToken = mockFactories.models.globale.sendCart.decorators.authToken;

var object = Object.create(null);
authToken(object);

describe('models/globale/sendCart/decorators/authToken.js', function () {
    describe('getAuthToken', function () {
        it('function: getAuthToken', function () {
            assert.isFunction(object.getAuthToken);
        });

        it('returns null', function () {
            request.set('clientId', null);
            assert.equal(object.getAuthToken(), null);
        });
    });
});
