'use strict';

var JWT = require('*/cartridge/models/globale/jwt/JWT');

/**
 * Verifies JWT token
 * @throws {Error}
 * @param {string} jwtString - JWT string
 * @param {string} publicKey - public key
 * @param {Object} options - options
 */
function verify(jwtString, publicKey, options) {
    if (!jwtString) {
        throw Error('JWT must be provided');
    }

    if (typeof jwtString !== 'string') {
        throw Error('JWT must be a string');
    }

    var jwt = new JWT(jwtString);
    jwt.verify(publicKey, options);
}

module.exports = {
    verify: verify
};
