'use strict';

function Cipher() {
    this.encrypt = function (value, publicKey, encryptionAlgorythm, base64Salt, iterations) { // eslint-disable-line no-unused-vars
        return publicKey + value;
    };

    this.decrypt = function (value, privateKey, encryptionAlgorythm, base64Salt, iterations) { // eslint-disable-line no-unused-vars
        return value.replace(privateKey, '');
    };
}

module.exports = Cipher;
