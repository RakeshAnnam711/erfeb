'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        add: {
            value: function (money) {
                var newValue = 0;
                try {
                    if (money) {
                        if (typeof money !== 'object') {
                            newValue = (Number(money) || 0);
                        } else if (money.valueOrNull) {
                            newValue = money.value;
                        }
                    }
                    if (newValue > 0) {
                        this.valueOrNull = this.getMoneyValue((this.valueOrNull !== null) ? (this.value + newValue) : newValue);
                    }
                } catch (e) {
                    this.logger.error('add: {0}', this.logger.message(e));
                }
                return this;
            }
        },
        addPercent: {
            value: function (percent) {
                try {
                    if (this.valueOrNull && percent && !isNaN(percent)) { // eslint-disable-line no-restricted-globals
                        this.valueOrNull = this.getMoneyValue(this.value * (1 + (percent / 100)));
                    }
                } catch (e) {
                    this.logger.error('addPercent: {0}', this.logger.message(e));
                }
                return this;
            }
        },
        addRate: {
            value: function (rate) {
                try {
                    if (this.valueOrNull && rate && !isNaN(rate)) { // eslint-disable-line no-restricted-globals
                        this.valueOrNull = this.getMoneyValue(this.value * (1 + rate));
                    }
                } catch (e) {
                    this.logger.error('addRate: {0}', this.logger.message(e));
                }
                return this;
            }
        }
    });
};
