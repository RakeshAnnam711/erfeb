'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        subtract: {
            value: function (money) {
                try {
                    if (this.valueOrNull && money && money.valueOrNull) {
                        if (this.currencyCode === money.currencyCode) {
                            this.valueOrNull = this.getMoneyValue(this.value - money.value);
                        } else {
                            this.valueOrNull = null;
                        }
                    }
                } catch (e) {
                    this.logger.error('subtract: {0}', this.logger.message(e));
                }
                return this;
            }
        },
        subtractPercent: {
            value: function (percent) {
                try {
                    if (this.valueOrNull && percent && !isNaN(percent)) { // eslint-disable-line no-restricted-globals
                        this.valueOrNull = this.getMoneyValue(this.value * (1 - (percent / 100)));
                    }
                } catch (e) {
                    this.logger.error('subtractPercent: {0}', this.logger.message(e));
                }
                return this;
            }
        },
        subtractRate: {
            value: function (rate) {
                try {
                    if (this.valueOrNull && rate && !isNaN(rate)) { // eslint-disable-line no-restricted-globals
                        this.valueOrNull = this.getMoneyValue(this.value * (1 - rate));
                    }
                } catch (e) {
                    this.logger.error('subtractRate: {0}', this.logger.message(e));
                }
                return this;
            }
        }
    });
};
