'use strict';

module.exports = function (object) {
    var geMinPrice;
    Object.defineProperties(object, {
        getMinPrice: {
            value: function () {
                var Money = require('dw/value/Money');
                var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
                var globaleSession = require('*/cartridge/models/globale/session');
                var globalePrice = require('*/cartridge/scripts/factories/globale/price');
                var minPrice = Money.NOT_AVAILABLE;
                try {
                    if (globaleSession.get('gePriceStrategy') === globaleHelpers.consts.priceStrategy.FIXED) {
                        if (this.product && (this.product.master || this.product.variationGroup || this.product.productSet)) {
                            var priceBookHelpers = require('*/cartridge/scripts/helpers/priceBookHelpers');
                            // calculate fixed price
                            priceBookHelpers.applyFixedPriceBooks(function () {
                                var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
                                var priceModel = this.product.getPriceModel();
                                var fixedPrice = priceModel.getMinPrice() || Money.NOT_AVAILABLE;
                                var fixedPriceBookId = priceModel.priceInfo ? priceModel.priceInfo.priceBook.ID : null;
                                minPrice = globaleMoney(
                                    fixedPrice.valueOrNull,
                                    globaleSession.get('geCurrency'),
                                    fixedPrice,
                                    fixedPrice.available,
                                    ((fixedPrice.available && fixedPriceBookId) || null)
                                );
                            }.bind(this));
                        } else {
                            // Sale Price
                            minPrice = this.getFixedPriceBookPrice();
                            if (!minPrice.available) {
                                // List Price
                                minPrice = this.getFixedPriceBookPrice(true);
                            }
                        }
                        if (minPrice.available || globaleSession.get('geUseFixedPricesOnly')) {
                            return minPrice;
                        }
                    }
                    minPrice = this.super.getMinPrice();
                    return globalePrice(minPrice, (this.product && this.product.ID));
                } catch (e) {
                    this.logger.error('getMinPrice: {0}', this.logger.message(e));
                }
                return minPrice;
            }
        },
        minPrice: {
            enumerable: true,
            get: function () {
                if (!geMinPrice) {
                    geMinPrice = this.getMinPrice();
                }
                return geMinPrice;
            }
        }
    });
};
