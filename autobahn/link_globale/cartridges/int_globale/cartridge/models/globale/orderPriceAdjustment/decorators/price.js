'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getPrice: {
            value: function () {
                var Discount = require('dw/campaign/Discount');
                var price = null;
                switch (this.priceAdjustment.appliedDiscount.type) {
                    case Discount.TYPE_PERCENTAGE:
                        price = object.getPercentagePrice();
                        break;
                    case Discount.TYPE_AMOUNT:
                        price = object.getAmountPrice();
                        break;
                    case Discount.TYPE_BONUS:
                    case Discount.TYPE_BONUS_CHOICE:
                        price = object.getBonusProductPrice();
                        break;
                    default:
                        break;
                }

                return price;
            }
        }
    });
};
