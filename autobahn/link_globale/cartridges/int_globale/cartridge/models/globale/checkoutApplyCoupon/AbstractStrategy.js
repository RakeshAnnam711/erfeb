'use strict';

/**
 * Represents abstract strategy
 * @constructor
 * @param {string} basketId - basket id
 * @param {string} token - token
 * @param {Object} jsonPayload - JSON Payload
 */
function AbstractStrategy(basketId, token, jsonPayload) {
    var globaleCrypto = require('*/cartridge/scripts/factories/globale/crypto');
    var geCrypto = globaleCrypto.getAESCrypto();

    this.jsonPayload = jsonPayload;
    this.basketId = basketId;
    this.token = geCrypto.decrypt(token);
}

/**
 * Applies coupon code
 * @abstract
 * @param {string} couponCode - coupon code
 * @throws {Error}
 */
AbstractStrategy.prototype.apply = function (couponCode) { // eslint-disable-line no-unused-vars
    throw new Error('apply function must be implemented by subclass!');
};

/**
 * Removes coupon code
 * @abstract
 * @param {string} couponCode - coupon code
 * @throws {Error}
 */
AbstractStrategy.prototype.remove = function (couponCode) { // eslint-disable-line no-unused-vars
    throw new Error('remove function must be implemented by subclass!');
};

module.exports = AbstractStrategy;
