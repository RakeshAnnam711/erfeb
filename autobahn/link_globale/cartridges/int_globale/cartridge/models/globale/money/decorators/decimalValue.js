/* global session */

'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getDecimalValue: {
            value: function () {
                var Money = require('dw/value/Money');
                return (this.valueOrNull !== null ? (new Money(this.valueOrNull, session.currency.currencyCode)).decimalValue : null);
            }
        },
        decimalValue: {
            enumerable: true,
            get: function () {
                return this.getDecimalValue();
            }
        }
    });
};
