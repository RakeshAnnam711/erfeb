'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getValue: {
            value: function () {
                return (this.valueOrNull || 0);
            }
        },
        value: {
            enumerable: true,
            get: function () {
                return this.getValue();
            }
        }
    });
};
