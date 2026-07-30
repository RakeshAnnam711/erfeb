'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getAmountPrice: {
            value: function () {
                var Discount = require('dw/campaign/Discount');
                var Decimal = require('dw/util/Decimal');
                var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
                var globalePrice = require('*/cartridge/scripts/factories/globale/price');

                var pliProrationData = this.pliProrationData;
                var discountAmount = this.productLineItem.basePrice.newMoney(new Decimal(this.priceAdjustment.appliedDiscount.amount));

                if (!this.priceAdjustment.promotion.custom[globaleHelpers.customAttr.promotion.geDoNotConvert]) {
                    var convertedDiscountAmount = new Decimal(globalePrice(this.productLineItem.basePrice.newMoney(new Decimal(this.priceAdjustment.appliedDiscount.amount)), this.productLineItem.productID, 1, true, false, false, true).value);
                    discountAmount = this.productLineItem.basePrice.newMoney(convertedDiscountAmount);
                }

                var priceAdjustmentPrice = this.productLineItem.basePrice.newMoney(new Decimal(0));

                for (var i = 0; i < this.priceAdjustment.appliedDiscount.quantity; i++) {
                    var pliProrationDataItem = pliProrationData.items[i];
                    var adjustmentItemPrice = discountAmount.value < pliProrationDataItem.proratedPrice.value ?
                        discountAmount :
                        pliProrationDataItem.proratedPrice;
                    pliProrationDataItem.adjustments.push({ type: Discount.TYPE_AMOUNT, price: adjustmentItemPrice });
                    pliProrationDataItem.proratedPrice = pliProrationDataItem.proratedPrice.subtract(adjustmentItemPrice);
                    priceAdjustmentPrice = priceAdjustmentPrice.add(adjustmentItemPrice);
                }

                return priceAdjustmentPrice.multiply(-1);
            }
        }
    });
};
