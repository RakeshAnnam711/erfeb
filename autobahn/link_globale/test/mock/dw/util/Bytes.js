'use strict';

function Bytes(hashMessage, encoding) {
    return {
        message: hashMessage,
        encoding: encoding
    };
}

module.exports = Bytes;
