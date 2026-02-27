'use strict';

module.exports = function (object, moneyValue) {
    Object.defineProperties(object, {
        valueOrNull: {
            enumerable: true,
            writable: true,
            value: ((moneyValue !== null) ? object.getMoneyValue(moneyValue) : null)
        },
        getValueOrNull: {
            value: function () {
                return this.valueOrNull;
            }
        }
    });
};
