'use strict';

module.exports = function (object) {
    var geMaxPrice;
    Object.defineProperties(object, {
        getMaxPrice: {
            value: function () {
                var Money = require('dw/value/Money');
                var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
                var globaleSession = require('*/cartridge/models/globale/session');
                var globalePrice = require('*/cartridge/scripts/factories/globale/price');
                var maxPrice = Money.NOT_AVAILABLE;
                try {
                    if (globaleSession.get('gePriceStrategy') === globaleHelpers.consts.priceStrategy.FIXED) {
                        if (this.product && (this.product.master || this.product.variationGroup || this.product.productSet)) {
                            var priceBookHelpers = require('*/cartridge/scripts/helpers/priceBookHelpers');
                            // calculate fixed price
                            priceBookHelpers.applyFixedPriceBooks(function () {
                                var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
                                var priceModel = this.product.getPriceModel();
                                var fixedPrice = priceModel.getMaxPrice() || Money.NOT_AVAILABLE;
                                var fixedPriceBookId = priceModel.priceInfo ? priceModel.priceInfo.priceBook.ID : null;
                                maxPrice = globaleMoney(
                                    fixedPrice.valueOrNull,
                                    globaleSession.get('geCurrency'),
                                    fixedPrice,
                                    fixedPrice.available,
                                    ((fixedPrice.available && fixedPriceBookId) || null)
                                );
                            }.bind(this));
                        } else {
                            // Sale Price
                            maxPrice = this.getFixedPriceBookPrice();
                            if (!maxPrice.available) {
                                // List Price
                                maxPrice = this.getFixedPriceBookPrice(true);
                            }
                        }
                        if (maxPrice.available || globaleSession.get('geUseFixedPricesOnly')) {
                            return maxPrice;
                        }
                    }
                    maxPrice = this.super.getMaxPrice();
                    return globalePrice(maxPrice, (this.product && this.product.ID));
                } catch (e) {
                    this.logger.error('getMaxPrice: {0}', this.logger.message(e));
                }
                return maxPrice;
            }
        },
        maxPrice: {
            enumerable: true,
            get: function () {
                if (!geMaxPrice) {
                    geMaxPrice = this.getMaxPrice();
                }
                return geMaxPrice;
            }
        }
    });
};
