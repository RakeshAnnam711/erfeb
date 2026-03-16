'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getAmountPrice: {
            value: function () {
                var globaleSession = require('*/cartridge/models/globale/session');
                var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
                var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
                var globalePrice = require('*/cartridge/scripts/factories/globale/price');
                var collections = require('*/cartridge/scripts/util/globale/collections');
                var price = this.priceAdjustment.price;
                if (!this.priceAdjustment.promotion.custom[globaleHelpers.customAttr.promotion.geDoNotConvert]) {
                    price = globalePrice(this.priceAdjustment.price, null, null, true, false, false, true);
                } else {
                    var promoDiscountAmount = this.priceAdjustment.appliedDiscount.amount * (-1);
                    var pliDiscountAmount = 0;
                    collections.forEach(this.priceAdjustment.proratedPrices.keySet(), function (productLineItem) {
                        if (productLineItem.adjustedPrice.isAvailable() && productLineItem.adjustedPrice.valueOrNull) {
                            pliDiscountAmount += productLineItem.adjustedPrice.valueOrNull * (-1);
                        }
                    });
                    price = globaleMoney((pliDiscountAmount > promoDiscountAmount ? pliDiscountAmount : promoDiscountAmount), globaleSession.get('geCurrency'));
                }

                return price;
            }
        }
    });
};
