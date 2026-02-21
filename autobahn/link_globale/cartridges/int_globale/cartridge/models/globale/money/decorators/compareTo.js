'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        compareTo: {
            value: function (money) {
                return ((!money || (money.currencyCode !== this.currencyCode) || (money.value !== this.value)) ? 1 : 0);
            }
        }
    });
};
