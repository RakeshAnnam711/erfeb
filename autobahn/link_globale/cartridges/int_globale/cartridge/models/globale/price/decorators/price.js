'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getPrice: {
            value: function () {
                var Money = require('dw/value/Money');
                var globaleSession = require('*/cartridge/models/globale/session');
                var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
                var globalePrice;
                try {
                    if (this.formatOnly === true) {
                        return globaleMoney(this.originalPrice.valueOrNull, globaleSession.get('geCurrency'), this.originalPrice);
                    }
                    var priceValue = ((((this.originalPrice instanceof Money) ? this.originalPrice.valueOrNull : Number(this.originalPrice)) / this.quantity));
                    if (priceValue !== null && priceValue !== 0) {
                        // convert end-customer Unite Price
                        if (!this.discount) {
                            priceValue = this.applyTaxVATCoefficients(priceValue);
                        }

                        var currencyRate = this.currencyRate;
                        if (currencyRate === null) {
                            throw new Error('Failed to get Currency Rate for ' + globaleSession.get('geCurrency'));
                        }
                        priceValue = (priceValue * this.currencyRate * this.coefficientRate);
                        // apply Rounding Rules
                        if ((this.skipRounding !== true) && !this.discount) {
                            priceValue = this.roundPrice(priceValue);
                        }
                        priceValue *= this.quantity;
                    } else if (!this.originalPrice.available) {
                        priceValue = null;
                    }
                    globalePrice = globaleMoney(priceValue, globaleSession.get('geCurrency'), this.originalPrice);
                } catch (e) {
                    this.logger.error('getPrice: {0}', this.logger.message(e));
                    globalePrice = globaleMoney(Money.NOT_AVAILABLE, globaleSession.get('geCurrency'), Money.NOT_AVAILABLE);
                }
                return globalePrice;
            }
        }
    });
};
