'use strict';

var mockFactories = require('../../../../../mock/factories/index');
var assert = require('chai').assert;
var RSA = new mockFactories.models.globale.crypto.RSA();
var globaleHelpers = mockFactories.scripts.helpers.globaleHelpers;

describe('models/globale/crypto/RSA.js', function () {
    describe('getPublicKey', function () {
        it('function', function () {
            assert.isFunction(RSA.getPublicKey);
        });

        it('returns public key', function () {
            globaleHelpers.setPreference(globaleHelpers.preferenceKeys.geRSAPublicKey, 'RSAPublicKey');
            assert.equal(RSA.getPublicKey(), 'RSAPublicKey');
        });
    });

    describe('getPrivateKey', function () {
        it('function', function () {
            assert.isFunction(RSA.getPrivateKey);
        });

        it('returns private key', function () {
            globaleHelpers.setPreference(globaleHelpers.preferenceKeys.geRSAPrivateKey, 'RSAPrivateKey');
            assert.equal(RSA.getPrivateKey(), 'RSAPrivateKey');
        });
    });

    describe('isEncrypted', function () {
        it('function', function () {
            assert.isFunction(RSA.isEncrypted);
        });

        it('checks if a value is encrypted: positive test', function () {
            assert.equal(RSA.isEncrypted('some_value'), true);
        });

        it('checks if a value is encrypted: negative test', function () {
            assert.equal(RSA.isEncrypted('somevalue'), false);
        });
    });

    describe('encrypt', function () {
        it('function', function () {
            assert.isFunction(RSA.encrypt);
        });

        it('encrypts value', function () {
            globaleHelpers.setPreference(globaleHelpers.preferenceKeys.geRSAPublicKey, 'emcryptionkey');
            globaleHelpers.setPreference(globaleHelpers.preferenceKeys.geRSAPrivateKey, 'emcryptionkey');
            assert.equal(RSA.encrypt('somevalue'), 'emcryptionkeysomevalue_Base6416bytes');
        });
    });

    describe('decrypt', function () {
        it('function', function () {
            assert.isFunction(RSA.decrypt);
        });

        it('decrypts value', function () {
            assert.equal(RSA.decrypt('emcryptionkeysomevalue_Base6416bytes'), 'somevalue');
        });
    });
});
