'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getPriceBeforeRounding: {
            value: function (qty) {
                var Money = require('dw/value/Money');
                var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
                var globaleSession = require('*/cartridge/models/globale/session');
                var price = Money.NOT_AVAILABLE;
                try {
                    if (globaleSession.get('gePriceStrategy') === globaleHelpers.consts.priceStrategy.FIXED) {
                        // Sale Price
                        price = this.getFixedPriceBookPrice(false, qty);
                        if (!price.available) {
                            // List Price
                            price = this.getFixedPriceBookPrice(true, qty);
                        }
                        if (price.available || globaleSession.get('geUseFixedPricesOnly')) {
                            return price;
                        }
                    }
                    var globalePrice = require('*/cartridge/scripts/factories/globale/price');
                    price = this.super.getPrice.apply(this.super, Array.prototype.slice.call(arguments));
                    return globalePrice(price, (this.product && this.product.ID), 1, true);
                } catch (e) {
                    this.logger.error('priceBeforeRounding: {0}', this.logger.message(e));
                }
                return price;
            }
        }
    });
};
