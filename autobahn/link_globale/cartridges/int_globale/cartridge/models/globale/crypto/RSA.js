'use strict';

const ALGORYTHM = 'RSA/ECB/OAEPWITHSHA-256ANDMGF1PADDING';

/**
 * Represents RSA crypto class
 * @constructor
 */
function RSA() {
    /**
     * Returns public key
     * @returns {string} - public key
     */
    this.getPublicKey = function () {
        var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
        return globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geRSAPublicKey);
    };

    /**
     * Returns private key
     * @returns {string} - public key
     */
    this.getPrivateKey = function () {
        var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
        return globaleHelpers.getPreference(globaleHelpers.preferenceKeys.geRSAPrivateKey);
    };

    /**
     * Checks if value is encrypted
     * @param {string} value - value to check
     * @returns {boolean} - encrypted or not
     */
    this.isEncrypted = function (value) {
        return value.split('_').length === 2;
    };

    /**
     * Encrypt and return a full encrypted value
     * @param {string} value - value to encrypt
     * @returns {string|null} - encrypted value
     */
    this.encrypt = function (value) {
        if (!(typeof value === 'string' && value.length > 0)) {
            return value;
        }

        if (!(this.getPublicKey() && this.getPrivateKey())) {
            return value;
        }

        var SecureRandom = require('dw/crypto/SecureRandom');
        var Cipher = require('dw/crypto/Cipher');
        var Encoding = require('dw/crypto/Encoding');
        var StringUtils = require('dw/util/StringUtils');

        // generate salt the random salt value should be generated for each stored value
        var random = new SecureRandom();
        var nextBytes = random.nextBytes(16);
        var base64Salt = Encoding.toBase64(nextBytes);

        // encrypt value with key and salt. Append "_"+salt to value
        var ciph = new Cipher();
        var encryptedValue = ciph.encrypt(value, this.getPublicKey(), ALGORYTHM, base64Salt, 0);
        var fullValue = StringUtils.format('{0}_{1}', encryptedValue, base64Salt);
        return fullValue;
    };

    /**
     * Decrypt and return the decrypted value
     * @param {string} fullValue - value to decrypt
     * @returns {string|null} - decrypted value
     */
    this.decrypt = function (fullValue) {
        if (!(typeof fullValue === 'string' && fullValue.length > 0)) {
            return fullValue;
        }

        if (!(this.getPublicKey() && this.getPrivateKey() && this.isEncrypted(fullValue))) {
            return fullValue;
        }

        var Cipher = require('dw/crypto/Cipher');
        var valueArr = fullValue.split('_');
        var value = valueArr[0] || '';
        var base64Salt = valueArr[1] || '';
        var privateKey = this.getPrivateKey();
        var ciph = new Cipher();
        var decryptedValue = ciph.decrypt(value, privateKey, ALGORYTHM, base64Salt, 0);
        return decryptedValue;
    };
}

module.exports = RSA;
