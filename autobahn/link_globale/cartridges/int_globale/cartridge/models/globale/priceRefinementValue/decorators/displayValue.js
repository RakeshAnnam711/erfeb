'use strict';

module.exports = function (object) {
    var displayValue;
    Object.defineProperties(object, {
        getDisplayValue: {
            value: function () {
                try {
                    var Money = require('dw/value/Money');
                    var globaleSession = require('*/cartridge/models/globale/session');
                    var currencyCode = globaleSession.getCurrency().currencyCode;
                    var globalePrice = require('*/cartridge/scripts/factories/globale/price');
                    var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
                    var valueFrom = new Money(0, currencyCode);
                    var valueTo = new Money(99999, currencyCode);
                    if (this.super.valueFrom && !isNaN(this.super.valueFrom)) { // eslint-disable-line no-restricted-globals
                        valueFrom = globalePrice(new Money(this.super.valueFrom, currencyCode));
                    } else {
                        valueFrom = globaleMoney(valueFrom.valueOrNull, globaleSession.get('geCurrency'), valueFrom);
                    }
                    if (this.super.valueTo && !isNaN(this.super.valueTo)) { // eslint-disable-line no-restricted-globals
                        valueTo = globalePrice(new Money(this.super.valueTo, currencyCode));
                    } else {
                        valueTo = globaleMoney(valueTo.valueOrNull, globaleSession.get('geCurrency'), valueTo);
                    }
                    if (valueFrom.available || valueTo.available) {
                        return (valueFrom.toFormattedString() + ' - ' + valueTo.toFormattedString());
                    }
                } catch (e) {
                    this.logger.error('getDisplayValue: {0}', this.logger.message(e));
                }
                return this.super.getDisplayValue();
            }
        },
        displayValue: {
            enumerable: true,
            get: function () {
                if (!displayValue) {
                    displayValue = this.getDisplayValue();
                }
                return displayValue;
            }
        }
    });
};
