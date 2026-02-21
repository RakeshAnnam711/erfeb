'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getFixedPrice: {
            value: function () {
                var Discount = require('dw/campaign/Discount');
                var Decimal = require('dw/util/Decimal');
                var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
                var globalePrice = require('*/cartridge/scripts/factories/globale/price');

                var pliProrationData = this.pliProrationData;
                var itemFixedPrice = this.productLineItem.basePrice.newMoney(new Decimal(this.priceAdjustment.appliedDiscount.fixedPrice));

                if (!this.priceAdjustment.promotion.custom[globaleHelpers.customAttr.promotion.geDoNotConvert]) {
                    var convertedItemFixedPrice = new Decimal(globalePrice(this.productLineItem.basePrice.newMoney(new Decimal(this.priceAdjustment.appliedDiscount.fixedPrice)), this.productLineItem.productID, 1, true, false, false, true).value);
                    itemFixedPrice = this.productLineItem.basePrice.newMoney(convertedItemFixedPrice);
                }

                var priceAdjustmentPrice = this.productLineItem.basePrice.newMoney(new Decimal(0));

                for (var i = 0; i < this.priceAdjustment.appliedDiscount.quantity; i++) {
                    var pliProrationDataItem = pliProrationData.items[i];
                    var adjustmentItemPrice = pliProrationDataItem.proratedPrice.subtract(itemFixedPrice);

                    pliProrationDataItem.adjustments.push({ type: Discount.TYPE_PRICEBOOK_PRICE, price: adjustmentItemPrice });
                    pliProrationDataItem.proratedPrice = pliProrationDataItem.proratedPrice.subtract(adjustmentItemPrice);
                    priceAdjustmentPrice = priceAdjustmentPrice.add(adjustmentItemPrice);
                }

                return priceAdjustmentPrice.multiply(-1);
            }
        }
    });
};
