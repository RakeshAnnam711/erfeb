'use strict';

module.exports = function (object) {
    var gePrice;
    Object.defineProperties(object, {
        getPrice: {
            value: function (qty) {
                var Money = require('dw/value/Money');
                var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
                var globalePrice = require('*/cartridge/scripts/factories/globale/price');
                var globaleSession = require('*/cartridge/models/globale/session');
                var globaleOptionModel = require('*/cartridge/scripts/factories/globale/optionModel');

                var price = Money.NOT_AVAILABLE;
                var geProductPrice;
                var geOptionModel;
                var geOptionsTotalPrice;

                try {
                    if (globaleSession.get('gePriceStrategy') === globaleHelpers.consts.priceStrategy.FIXED) {
                        // Sale Price
                        price = this.getFixedPriceBookPrice(false, qty);
                        if (!price.available) {
                            // List Price
                            price = this.getFixedPriceBookPrice(true, qty);
                        }

                        if (this.product.isOptionProduct() && price.available) {
                            geOptionModel = globaleOptionModel(this.currentOptionModel || this.product.getOptionModel());
                            geOptionsTotalPrice = geOptionModel.getSelectedOptionsTotalPrice(price.currencyCode);
                            price = price.add(geOptionsTotalPrice);
                        }

                        if (price.available || globaleSession.get('geUseFixedPricesOnly')) {
                            return price;
                        }
                    }

                    price = this.super.getPrice.apply(this.super, Array.prototype.slice.call(arguments));
                    if (this.product.isOptionProduct() && !this.splitOptions) {
                        geOptionModel = globaleOptionModel(this.currentOptionModel || this.product.getOptionModel());
                        geOptionsTotalPrice = geOptionModel.getSelectedOptionsTotalPrice(price.currencyCode);
                        var geOriginalOptionsTotalPrice = geOptionModel.getSelectedOriginalOptionsTotalPrice(price.currencyCode);

                        price = price.subtract(geOriginalOptionsTotalPrice);
                        geProductPrice = globalePrice(price, (this.product && this.product.ID));
                        geProductPrice.add(geOptionsTotalPrice);
                    } else {
                        geProductPrice = globalePrice(price, (this.product && this.product.ID));
                    }

                    return geProductPrice;
                } catch (e) {
                    this.logger.error('getPrice: {0}', this.logger.message(e));
                    price = Money.NOT_AVAILABLE;
                }
                return price;
            }
        },
        price: {
            enumerable: true,
            get: function () {
                if (!gePrice) {
                    gePrice = this.getPrice();
                }
                return gePrice;
            }
        }
    });
};
