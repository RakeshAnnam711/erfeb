'use strict';

var mockFactories = require('../../../../../../mock/factories/index');
var assert = require('chai').assert;

var request = mockFactories.models.globale.request;
var sessionId = mockFactories.models.globale.sendCart.decorators.sessionId;

var object = Object.create(null);
sessionId(object);

describe('models/globale/sendCart/decorators/sessionId.js', function () {
    describe('getSessionId', function () {
        it('function: getSessionId', function () {
            assert.isFunction(object.getSessionId);
        });

        it('returns null', function () {
            request.set('clientId', 'clientId');
            assert.equal(object.getSessionId(), null);
        });
    });
});
