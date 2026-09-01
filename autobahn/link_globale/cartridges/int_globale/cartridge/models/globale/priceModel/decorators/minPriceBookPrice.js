'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getMinPriceBookPrice: {
            value: function (priceBookId) {
                var Money = require('dw/value/Money');
                var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
                var globaleSession = require('*/cartridge/models/globale/session');
                var globalePrice = require('*/cartridge/scripts/factories/globale/price');
                var minPriceBookPrice = Money.NOT_AVAILABLE;
                try {
                    if (globaleSession.get('gePriceStrategy') === globaleHelpers.consts.priceStrategy.FIXED) {
                        var priceBookHelpers = require('*/cartridge/scripts/helpers/priceBookHelpers');
                        var applicableFixedPriceBookIDs = priceBookHelpers.getApplicableFixedPricebooksIDs();
                        if (applicableFixedPriceBookIDs.indexOf(priceBookId) !== -1) {
                            if (this.product && (this.product.master || this.product.variationGroup || this.product.productSet)) {
                                // calculate fixed price
                                priceBookHelpers.applyFixedPriceBooks(function () {
                                    var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
                                    var priceModel = this.product.getPriceModel();
                                    var fixedPrice = priceModel.getMinPriceBookPrice(priceBookId) || Money.NOT_AVAILABLE;
                                    minPriceBookPrice = globaleMoney(
                                        fixedPrice.valueOrNull,
                                        globaleSession.get('geCurrency'),
                                        fixedPrice,
                                        fixedPrice.available,
                                        ((fixedPrice.available && priceBookId) || null)
                                    );
                                }.bind(this));
                            } else {
                                minPriceBookPrice = this.getFixedPriceBookPrice();
                            }
                            if (minPriceBookPrice.available || globaleSession.get('geUseFixedPricesOnly')) {
                                return minPriceBookPrice;
                            }
                        }
                    }
                    minPriceBookPrice = this.super.getMinPriceBookPrice.apply(this.super, Array.prototype.slice.call(arguments));
                    return globalePrice(minPriceBookPrice, (this.product && this.product.ID));
                } catch (e) {
                    this.logger.error('getMinPriceBookPrice: {0}', this.logger.message(e));
                }
                return minPriceBookPrice;
            }
        }
    });
};
