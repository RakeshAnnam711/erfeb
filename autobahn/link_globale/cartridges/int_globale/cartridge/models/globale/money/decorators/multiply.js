'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        multiply: {
            value: function (factor) {
                try {
                    factor = (Number(factor) || Number(factor.value) || null); // eslint-disable-line no-param-reassign
                    if (this.valueOrNull && factor && !isNaN(factor)) { // eslint-disable-line no-restricted-globals
                        this.valueOrNull = this.getMoneyValue(this.value * factor);
                    }
                } catch (e) {
                    this.logger.error('multiply: {0}', this.logger.message(e));
                }
                return this;
            }
        }
    });
};
