'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getPrice: {
            value: function () {
                var price = this.super.getPrice.apply(this.super, Array.prototype.slice.call(arguments));
                try {
                    return (require('*/cartridge/scripts/factories/globale/price'))(price);
                } catch (e) {
                    this.logger.error('getPrice: {0}', this.logger.message(e));
                }
                return price;
            }
        },
        getOriginalPrice: {
            value: function () {
                return this.super.getPrice.apply(this.super, Array.prototype.slice.call(arguments));
            }
        },
        getPriceBeforeRounding: {
            value: function () {
                var price = this.super.getPrice.apply(this.super, Array.prototype.slice.call(arguments));
                try {
                    return (require('*/cartridge/scripts/factories/globale/price'))(price, null, 1, true);
                } catch (e) {
                    this.logger.error('priceBeforeRounding: {0}', this.logger.message(e));
                }
                return price;
            }
        },
        getSelectedOptionsTotalPrice: {
            value: function (currencyCode) {
                var Money = require('dw/value/Money');
                var collections = require('*/cartridge/scripts/util/globale/collections');
                var globalePrice = require('*/cartridge/scripts/factories/globale/price');

                var geOptionsTotalPrice = globalePrice(new Money(0, currencyCode));
                collections.forEach(this.super.getOptions(), function (option) {
                    var selectedOptionValue = this.super.getSelectedOptionValue(option);
                    var selectedOptionValuePrice = this.getPrice(selectedOptionValue);
                    geOptionsTotalPrice.add(selectedOptionValuePrice);
                }, this);

                return geOptionsTotalPrice;
            }
        },
        getSelectedOriginalOptionsTotalPrice: {
            value: function (currencyCode) {
                var Money = require('dw/value/Money');
                var collections = require('*/cartridge/scripts/util/globale/collections');

                var geOriginalOptionsTotalPrice = new Money(0, currencyCode);
                collections.forEach(this.super.getOptions(), function (option) {
                    var selectedOptionValue = this.super.getSelectedOptionValue(option);
                    var selectedOptionValuePrice = this.getOriginalPrice(selectedOptionValue);
                    geOriginalOptionsTotalPrice = geOriginalOptionsTotalPrice.add(selectedOptionValuePrice);
                }, this);

                return geOriginalOptionsTotalPrice;
            }
        }
    });
};
