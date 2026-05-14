'use strict';

module.exports = function (object) {
    Object.defineProperties(object, {
        getTotalFixedPrice: {
            value: function () {
                var Money = require('dw/value/Money');
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
                var originalDiscountedPricePerAppliedQty = originalProductLineItem.basePrice.multiply(this.priceAdjustment.appliedDiscount.quantity).add(originalPriceAdjustment.price);
                var totalFixedPricePerAppliedQty = this.productLineItem.basePrice.newMoney(new Decimal(this.priceAdjustment.appliedDiscount.totalFixedPrice));
                var discountRatePerAppliedQty = originalDiscountedPricePerAppliedQty.value / totalFixedPricePerAppliedQty.value;
                var discountedTotalPerAppliedQty = totalFixedPricePerAppliedQty.subtractRate(1 - discountRatePerAppliedQty);

                if (!this.priceAdjustment.promotion.custom[globaleHelpers.customAttr.promotion.geDoNotConvert]) {
                    var convertedDiscountAmount = globalePrice(this.productLineItem.basePrice.newMoney(new Decimal(this.priceAdjustment.appliedDiscount.totalFixedPrice)), null, 1, true, false, false, true);
                    discountedTotalPerAppliedQty = this.productLineItem.basePrice.newMoney(new Decimal(convertedDiscountAmount.value));
                }

                var pliItemsTotalPerAppliedQty = this.productLineItem.basePrice.newMoney(new Decimal(0));
                var pliItems = [];
                var i = 0;
                var pliProrationDataItem = null;

                for (i = 0; i < this.priceAdjustment.appliedDiscount.quantity; i++) {
                    pliProrationDataItem = pliProrationData.items[i];
                    pliItems.push(pliProrationDataItem);
                    pliItemsTotalPerAppliedQty = pliItemsTotalPerAppliedQty.add(pliProrationDataItem.proratedPrice);
                }
                var priceAdjustmentPrice = discountedTotalPerAppliedQty.subtract(pliItemsTotalPerAppliedQty);
                var proratedItemPricesPerAppliedQty = Money.prorate(priceAdjustmentPrice, pliItems.map(function (item) {
                    return item.proratedPrice;
                }));

                pliItems.forEach(function (pliItem, index) {
                    var proratedItemPrice = proratedItemPricesPerAppliedQty[index];
                    var adjustmentItemPrice = proratedItemPrice.subtract(pliItem.proratedPrice);
                    pliItem.adjustments.push({ type: Discount.TYPE_TOTAL_FIXED_PRICE, price: adjustmentItemPrice });
                    // eslint-disable-next-line no-param-reassign
                    pliItem.proratedPrice = proratedItemPrice;
                });

                return priceAdjustmentPrice;
            }
        }
    });
};
