'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        equals: {
            value: function (money) {
                return (money && (money.valueOrNull === this.valueOrNull));
            }
        }
    });
};
