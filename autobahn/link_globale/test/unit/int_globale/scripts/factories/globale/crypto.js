'use strict';

var mockFactories = require('../../../../../mock/factories/index');
var assert = require('chai').assert;
var crypto = mockFactories.scripts.factories.globale.crypto;

describe('scripts/factories/globale/crypto.js', function () {
    describe('getRSACrypto', function () {
        it('function', function () {
            assert.isFunction(crypto.getRSACrypto);
        });
    });

    describe('getAESCrypto', function () {
        it('function', function () {
            assert.isFunction(crypto.getAESCrypto);
        });
    });
});
