/* eslint-disable no-undef */

'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        divide: {
            value: function (divisor) {
                var Money = require('dw/value/Money');
                var globaleMoney = require('*/cartridge/scripts/factories/globale/money');

                var price = new Money(this.value, session.currency.currencyCode);

                try {
                    if (this.valueOrNull && divisor && !isNaN(divisor)) { // eslint-disable-line no-restricted-globals
                        price = price.divide(Number(divisor));
                    }
                } catch (e) {
                    this.logger.error('divide: {0}', this.logger.message(e));
                }

                return globaleMoney(price.valueOrNull, this.currencyCode);
            }
        }
    });
};
