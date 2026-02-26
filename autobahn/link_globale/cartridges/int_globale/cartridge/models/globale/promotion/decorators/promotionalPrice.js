/* eslint-disable no-undef */

'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getPromotionalPrice: {
            value: function (product, optionModel) {
                var Money = require('dw/value/Money');
                var Discount = require('dw/campaign/Discount');
                var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
                var promotionalPrice = this.super.getPromotionalPrice.apply(this.super, Array.prototype.slice.call(arguments));
                try {
                    var globaleSession = require('*/cartridge/models/globale/session');
                    var globalePriceModel = require('*/cartridge/scripts/factories/globale/priceModel');
                    var globalePrice = require('*/cartridge/scripts/factories/globale/price');
                    var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
                    var priceModel = globalePriceModel((optionModel ? product.getPriceModel(optionModel) : product.priceModel), product, optionModel);
                    var discount;

                    // @TODO implement logic that allows to get the promotional price for a fixed price country even if no base price books are assigned to the site

                    if (!this.isGlobalePromotion()) {
                        return Money.NOT_AVAILABLE;
                    }
                    if ((this.custom[globaleHelpers.customAttr.promotion.geDiscountType].value === Discount.TYPE_PERCENTAGE) && promotionalPrice.valueOrNull) {
                        var percentage = (promotionalPrice.value / priceModel.super.price.value).toFixed(2);
                        return (priceModel.price.available
                            ? globaleMoney((priceModel.price.value * percentage), globaleSession.get('geCurrency'), promotionalPrice)
                            : Money.NOT_AVAILABLE);
                    }
                    if (this.custom[globaleHelpers.customAttr.promotion.geDiscountType].value === Discount.TYPE_AMOUNT) {
                        var doNotConvertDiscount = this.super.custom[globaleHelpers.customAttr.promotion.geDoNotConvert];
                        discount = priceModel.super.price.subtract(promotionalPrice);

                        if (
                            doNotConvertDiscount
                            && this.super.custom[globaleHelpers.customAttr.promotion.geDiscountPrice]
                            && globaleSession.get('gePriceStrategy') === globaleHelpers.consts.priceStrategy.DYNAMIC
                        ) {
                            var geDiscountPrice = new Money(this.super.custom[globaleHelpers.customAttr.promotion.geDiscountPrice], session.currency.currencyCode);
                            var gePrice = new Money(priceModel.price.value, session.currency.currencyCode);
                            discount = gePrice.subtract(geDiscountPrice) <= 0 ? priceModel.price : geDiscountPrice;
                        }

                        if (!doNotConvertDiscount) {
                            if (promotionalPrice.value === 0) {
                                discount = priceModel.price;
                            } else {
                                discount = globalePrice(discount, product.ID, 1, true, false, false, true);
                            }
                        }

                        var promotionalPriceValue = (priceModel.price.value - discount.value);
                        promotionalPriceValue = (promotionalPriceValue < 0) ? 0 : promotionalPriceValue;

                        return (priceModel.price.available
                            ? globaleMoney(promotionalPriceValue, globaleSession.get('geCurrency'), promotionalPrice)
                            : Money.NOT_AVAILABLE);
                    }
                    if (
                        [Discount.TYPE_FIXED_PRICE, Discount.TYPE_PRICEBOOK_PRICE, Discount.TYPE_TOTAL_FIXED_PRICE].indexOf(this.custom[globaleHelpers.customAttr.promotion.geDiscountType].value) !== -1 &&
                        this.custom[globaleHelpers.customAttr.promotion.geDoNotConvert] !== true
                    ) {
                        return globalePrice(promotionalPrice, product.ID, 1, false);
                    }
                    if (this.custom[globaleHelpers.customAttr.promotion.geDoNotConvert] !== true) {
                        return globalePrice(promotionalPrice, product.ID, 1, true);
                    }
                    return globaleMoney(promotionalPrice.valueOrNull, globaleSession.get('geCurrency'), promotionalPrice);
                } catch (e) {
                    this.logger.error('getPromotionalPrice: {0}', this.logger.message(e));
                }
                return promotionalPrice;
            }
        }
    });
};
