'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        isAvailable: {
            value: function () {
                return this.super !== null ? this.super.available : this.valueOrNull !== null;
            }
        },
        available: {
            enumerable: true,
            get: function () {
                return this.isAvailable();
            }
        }
    });
};
