'use strict';

const ALGORYTHMS = {
    RS256: 'SHA256withRSA'
};

/**
 * Represents JWT
 * @constructor
 * @throws {Error}
 * @param {string} token - JWT token
 */
function JWT(token) {
    var StringUtils = require('dw/util/StringUtils');

    var jwtString = token.replace('Bearer ', '');

    this.jwtParts = jwtString.split('.');
    if (this.jwtParts.length !== 3) {
        throw Error('JWT malformed');
    }

    this.header = null;
    this.body = null;
    this.signature = this.jwtParts[2];

    try {
        this.header = JSON.parse(StringUtils.decodeBase64(this.jwtParts[0]));
    } catch (e) {
        throw Error('JWT invalid header');
    }

    try {
        this.body = JSON.parse(StringUtils.decodeBase64(this.jwtParts[1]));
    } catch (e) {
        throw Error('JWT invalid body');
    }
}

/**
 * Verifies JWT
 * @throws {Error}
 * @param {string} publicKey - public key
 * @param {Object} options - options
 */
JWT.prototype.verify = function (publicKey, options) {
    var StringUtils = require('dw/util/StringUtils');
    var Signature = require('dw/crypto/Signature');
    var validator = require('*/cartridge/scripts/util/globale/validator');

    // validate signature
    if (publicKey) {
        var contentToVerify = StringUtils.encodeBase64(this.jwtParts[0] + '.' + this.jwtParts[1]);
        var dgstTool = new Signature();
        if (!dgstTool.verifySignature(this.signature, contentToVerify, publicKey, ALGORYTHMS[options.algorithm])) {
            throw Error('Invalid JWT signature');
        }
    }

    // validate header
    if (options && options.algorithm) {
        var headValidationSchema = {
            alg: { required: true, equals: options.algorithm },
            typ: { required: true, equals: 'JWT' }
        };
        var headValidationResult = validator.validate(this.header, headValidationSchema);
        if (!headValidationResult.valid) {
            throw Error('Invalid JWT head: ' + JSON.stringify(headValidationResult));
        }
    }

    // validate body
    var payloadValidationSchema = {
        exp: { required: true }
    };

    if (options && options.issuer) {
        payloadValidationSchema.iss = { equals: options.issuer };
    }

    var payloadValidationResult = validator.validate(this.body, payloadValidationSchema);
    if (!payloadValidationResult.valid) {
        throw Error('Invalid JWT payload: ' + JSON.stringify(payloadValidationResult));
    }

    // validate expiration
    var clockTimestamp = Math.floor(Date.now() / 1000);
    var exp = Number(this.body.exp);
    if (clockTimestamp >= exp) {
        throw Error('JWT expired: ' + new Date(exp * 1000));
    }
};

module.exports = JWT;
