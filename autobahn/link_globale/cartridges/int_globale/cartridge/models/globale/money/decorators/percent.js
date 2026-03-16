'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        percentLessThan: {
            value: function (money) {
                return (money && money.value && this.value && ((money.value - this.value) / (money.value / 100)));
            }
        },
        percentOf: {
            value: function (money) {
                if (this.valueOrNull && money.valueOrNull) {
                    return (Math.round((this.value / (money.value / 100)) * 100) / 100);
                }
                return null;
            }
        }
    });
};
