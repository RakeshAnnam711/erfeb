'use strict';

var crypto = {
    RSA: require('*/cartridge/models/globale/crypto/RSA'),
    AES: require('*/cartridge/models/globale/crypto/AES')
};

/**
 * Returns RSA crypto
 * @see {@link module:models/globale/crypto/RSA}
 * @returns {RSA} - RSA crypto
 */
function getRSACrypto() {
    return new crypto.RSA();
}

/**
 * Returns AES crypto
 * @see {@link module:models/globale/crypto/AES}
 * @returns {AES} - AES crypto
 */
function getAESCrypto() {
    return new crypto.AES();
}

module.exports = {
    getRSACrypto: getRSACrypto,
    getAESCrypto: getAESCrypto
};
