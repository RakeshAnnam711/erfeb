'use strict';

/**
 * Decodes a URL safe string into its original form
 * @param {string} value - value to decode
 */
function fromURI(value) {
    return value;
}

/**
 * Encodes value to Base64
 * @param {string} value - value to encode
 */
function toBase64(value) {
    return 'Base64' + value;
}

module.exports = {
    fromURI: fromURI,
    toBase64: toBase64
};
