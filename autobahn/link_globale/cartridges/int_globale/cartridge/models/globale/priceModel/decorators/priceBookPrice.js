'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getPriceBookPrice: {
            value: function (priceBookId) {
                var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
                var globaleSession = require('*/cartridge/models/globale/session');
                var globalePrice = require('*/cartridge/scripts/factories/globale/price');
                var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
                var priceBookHelpers = require('*/cartridge/scripts/helpers/priceBookHelpers');
                var globaleOptionModel = require('*/cartridge/scripts/factories/globale/optionModel');

                var priceBookPrice = this.super.getPriceBookPrice.apply(this.super, Array.prototype.slice.call(arguments));
                var geProductPrice;

                try {
                    if (
                        (globaleSession.get('gePriceStrategy') === globaleHelpers.consts.priceStrategy.FIXED)
                        && (priceBookHelpers.getApplicableFixedPricebooksIDs().indexOf(priceBookId) !== -1)
                    ) {
                        return globaleMoney(priceBookPrice.valueOrNull, globaleSession.get('geCurrency'), priceBookPrice, true, priceBookId);
                    }

                    if (this.product.isOptionProduct() && !this.splitOptions) {
                        var geOptionModel = globaleOptionModel(this.currentOptionModel || this.product.getOptionModel());
                        var geOptionsTotalPrice = geOptionModel.getSelectedOptionsTotalPrice(priceBookPrice.currencyCode);
                        var geOriginalOptionsTotalPrice = geOptionModel.getSelectedOriginalOptionsTotalPrice(priceBookPrice.currencyCode);

                        priceBookPrice = priceBookPrice.subtract(geOriginalOptionsTotalPrice);
                        geProductPrice = globalePrice(priceBookPrice, (this.product && this.product.ID));
                        geProductPrice.add(geOptionsTotalPrice);
                    } else {
                        geProductPrice = globalePrice(priceBookPrice, (this.product && this.product.ID));
                    }

                    return geProductPrice;
                } catch (e) {
                    this.logger.error('getPriceBookPrice: {0}', this.logger.message(e));
                }
                return priceBookPrice;
            }
        }
    });
};
