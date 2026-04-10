'use strict';

var mockFactories = require('../../../../../../mock/factories/index');
var assert = require('chai').assert;

var request = mockFactories.models.globale.request;
var webStoreCodes = mockFactories.models.globale.sendCart.decorators.webStoreCodes;

var object = Object.create(null);
webStoreCodes(object);

describe('models/globale/sendCart/decorators/webStoreCodes.js', function () {
    describe('getWebStoreCode', function () {
        it('Function', function () {
            assert.isFunction(object.getWebStoreCode);
        });

        it('returns WebStoreCode', function () {
            assert.equal(object.getWebStoreCode(), 'RefArchGlobal');
        });
    });

    describe('getWebStoreInstanceCode', function () {
        it('Function', function () {
            assert.isFunction(object.getWebStoreInstanceCode);
        });

        it('InstanceHostname', function () {
            request.set('clientId', null);
            assert.equal(object.getWebStoreInstanceCode(), 'test-001.sandbox.us01.dx.commercecloud.salesforce.com');
        });

        it('Request httpHost', function () {
            request.set('clientId', null);
            request.set('httpHost', 'test-002.sandbox.us01.dx.commercecloud.salesforce.com');
            assert.equal(object.getWebStoreInstanceCode(), 'test-002.sandbox.us01.dx.commercecloud.salesforce.com');
        });
    });
});
