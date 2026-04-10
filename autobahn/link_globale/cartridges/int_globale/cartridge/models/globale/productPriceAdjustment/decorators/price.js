'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getPrice: {
            value: function () {
                var Discount = require('dw/campaign/Discount');
                var price = null;
                switch (this.priceAdjustment.appliedDiscount.type) {
                    case Discount.TYPE_PERCENTAGE:
                    case Discount.TYPE_PERCENTAGE_OFF_OPTIONS:
                        price = object.getPercentagePrice();
                        break;
                    case Discount.TYPE_AMOUNT:
                        price = object.getAmountPrice();
                        break;
                    case Discount.TYPE_FIXED_PRICE:
                        price = object.getFixedPrice();
                        break;
                    case Discount.TYPE_PRICEBOOK_PRICE:
                        price = object.getPricebookPrice();
                        break;
                    case Discount.TYPE_TOTAL_FIXED_PRICE:
                        price = object.getTotalFixedPrice();
                        break;
                    case Discount.TYPE_BONUS:
                    case Discount.TYPE_BONUS_CHOICE:
                        price = object.getBonusProductPrice();
                        break;
                    case Discount.TYPE_FREE:
                        price = object.getFreePrice();
                        break;
                    default:
                        break;
                }

                return price;
            }
        }
    });
};
