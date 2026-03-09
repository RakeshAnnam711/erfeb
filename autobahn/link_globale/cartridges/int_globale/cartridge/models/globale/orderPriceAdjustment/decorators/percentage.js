'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getPercentagePrice: {
            value: function () {
                var globaleSession = require('*/cartridge/models/globale/session');
                var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
                var collections = require('*/cartridge/scripts/util/globale/collections');

                var price = null;
                var pliProratedPrice = null;
                var appliedDiscountPercentage = this.priceAdjustment.appliedDiscount.percentage / 100;

                if (this.basket.allProductLineItems.length === this.priceAdjustment.proratedPrices.values().length) {
                    price = (-1) * (this.basket.merchandizeTotalPrice.value - this.appliedDiscountsTotal) * appliedDiscountPercentage;
                } else {
                    // Order level discounts with product exclusions and/or qualifying products
                    var pliPriceAdjustment = 0;
                    collections.forEach(this.priceAdjustment.proratedPrices.keySet(), function (productLineItem) {
                        if (!this.proratedPliDiscountedPricesHashMap.containsKey(productLineItem)) {
                            this.proratedPliDiscountedPricesHashMap.put(productLineItem, productLineItem.adjustedPrice.getValue());
                        }

                        pliProratedPrice = this.proratedPliDiscountedPricesHashMap.get(productLineItem);
                        pliPriceAdjustment -= pliProratedPrice * appliedDiscountPercentage;
                        this.proratedPliDiscountedPricesHashMap.put(productLineItem, pliProratedPrice + pliPriceAdjustment);
                    }, this);

                    price = pliPriceAdjustment;
                }

                return globaleMoney(price, globaleSession.get('geCurrency'));
            }
        }
    });
};
