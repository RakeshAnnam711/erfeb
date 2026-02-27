'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getMoneyValue: {
            value: function (value) {
                try {
                    if (!value || isNaN(value)) { // eslint-disable-line no-restricted-globals
                        return 0;
                    }
                    var numbers = require('*/cartridge/scripts/util/globale/numbers');
                    return numbers.round(value, (this.currency ? this.currency.custom.maxDecimalPlaces : 2));
                } catch (e) {
                    this.logger.error('getMoneyValue: {0}', this.logger.message(e));
                }
                return 0;
            }
        }
    });
};
