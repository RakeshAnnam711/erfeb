'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getPricebookPrice: {
            value: function () {
                var Discount = require('dw/campaign/Discount');
                var Decimal = require('dw/util/Decimal');

                var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
                var globalePrice = require('*/cartridge/scripts/factories/globale/price');

                var originalProductLineItem = (this.productLineItem.UUID in this.originalDiscounts.productLineItems) ?
                    this.originalDiscounts.productLineItems[this.productLineItem.UUID] :
                    null;
                var originalPriceAdjustment = (originalProductLineItem && (this.priceAdjustment.UUID in originalProductLineItem.priceAdjustments)) ?
                    originalProductLineItem.priceAdjustments[this.priceAdjustment.UUID] :
                    null;

                var pliProrationData = this.pliProrationData;
                var itemPriceBookPrice = originalProductLineItem.basePrice.add(originalPriceAdjustment.price.divide(originalPriceAdjustment.quantity));
                if (!this.priceAdjustment.promotion.custom[globaleHelpers.customAttr.promotion.geDoNotConvert]) {
                    itemPriceBookPrice = this.productLineItem.basePrice.newMoney(new Decimal(globalePrice(itemPriceBookPrice, this.productLineItem.productID, 1, true, false, false, true).value));
                }

                var priceAdjustmentPrice = this.productLineItem.basePrice.newMoney(new Decimal(0));

                for (var i = 0; i < this.priceAdjustment.appliedDiscount.quantity; i++) {
                    var pliProrationDataItem = pliProrationData.items[i];
                    var adjustmentItemPrice = pliProrationDataItem.proratedPrice.subtract(itemPriceBookPrice);

                    pliProrationDataItem.adjustments.push({ type: Discount.TYPE_FIXED_PRICE, price: adjustmentItemPrice });
                    pliProrationDataItem.proratedPrice = pliProrationDataItem.proratedPrice.subtract(adjustmentItemPrice);
                    priceAdjustmentPrice = priceAdjustmentPrice.add(adjustmentItemPrice);
                }

                return priceAdjustmentPrice.multiply(-1);
            }
        }
    });
};
