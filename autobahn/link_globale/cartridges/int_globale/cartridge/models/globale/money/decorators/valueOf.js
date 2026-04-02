'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        valueOf: {
            value: function () {
                return this.getValue();
            }
        }
    });
};
