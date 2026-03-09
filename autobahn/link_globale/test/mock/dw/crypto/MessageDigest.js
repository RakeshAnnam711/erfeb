'use strict';

function MessageDigest() {
    this.digestBytes = function (message) { return JSON.stringify(message); };
}

module.exports = MessageDigest;
