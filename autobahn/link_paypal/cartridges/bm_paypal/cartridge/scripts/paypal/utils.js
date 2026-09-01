'use strict';

const Logger = require('dw/system/Logger');

let paypalLogger;

/**
 * Get logger instance
 * @param {string|Object} msg Error message
 */
function createErrorLog(msg) {
    paypalLogger = paypalLogger || Logger.getLogger('PayPal-BM', 'PayPal_General');

    if (!empty(msg)) {
        paypalLogger.error(msg);
    } else {
        paypalLogger.debug('Empty log entry');
    }
}

/**
 * Encodes an object into encoded string
 * @param {Object} obj An object to encode
 * @returns {string} encoded string
 */
function encodeString(obj) {
    const Bytes = require('dw/util/Bytes');
    const Encoding = require('dw/crypto/Encoding');

    const bytes = new Bytes(JSON.stringify(obj));

    return Encoding.toBase64(bytes);
}

module.exports = {
    createErrorLog: createErrorLog,
    encodeString: encodeString
};
