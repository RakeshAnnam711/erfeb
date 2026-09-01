'use strict';

function SecureRandom() {
    this.nextBytes = function (value) {
        return value + 'bytes';
    };
}

module.exports = SecureRandom;
