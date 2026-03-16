'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getBonusProductPrice: {
            value: function () {
                var Discount = require('dw/campaign/Discount');
                var Decimal = require('dw/util/Decimal');

                var pliProrationData = this.pliProrationData;
                var priceAdjustmentPrice = this.productLineItem.basePrice.newMoney(new Decimal(0));

                for (var i = 0; i < this.priceAdjustment.appliedDiscount.quantity; i++) {
                    var pliProrationDataItem = pliProrationData.items[i];
                    var adjustmentItemPrice = pliProrationDataItem.proratedPrice;

                    pliProrationDataItem.adjustments.push({ type: Discount.TYPE_BONUS, price: adjustmentItemPrice });
                    pliProrationDataItem.proratedPrice = pliProrationDataItem.proratedPrice.subtract(adjustmentItemPrice);

                    priceAdjustmentPrice = priceAdjustmentPrice.add(adjustmentItemPrice);
                }

                return priceAdjustmentPrice.multiply(-1);
            }
        }
    });
};
