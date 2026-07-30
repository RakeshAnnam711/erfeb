'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        newMoney: {
            value: function (newValue) {
                try {
                    if (newValue === null) {
                        this.valueOrNull = null;
                    } else if (newValue) {
                        this.valueOrNull = ((Number(newValue) || Number(newValue.value)) || null);
                    }
                } catch (e) {
                    this.logger.error('newMoney: {0}', this.logger.message(e));
                }
                return this;
            }
        }
    });
};
