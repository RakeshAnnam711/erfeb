'use strict';

/**
 * Collects Original Order and Product Line Item prices and it's Price Adjustments
 * @returns {Object} - Original Discounts
 */
function geCollectOriginalDiscountsData() {
    var Decimal = require('dw/util/Decimal');

    var collections = require('*/cartridge/scripts/util/globale/collections');
    var originalDiscounts = { productLineItems: {}, order: {}, priceAdjustments: {} };

    // product discounts
    collections.forEach(this.allProductLineItems, function (productLineItem) {
        var pli = {
            productId: productLineItem.productID,
            priceAdjustments: {},
            quantityValue: productLineItem.quantityValue,
            price: productLineItem.price,
            adjustedPrice: productLineItem.adjustedPrice,
            basePrice: productLineItem.basePrice,
            proratedPrice: productLineItem.proratedPrice
        };

        var discountedPliPriceBeforePriceAdjustment = productLineItem.price.newMoney(new Decimal(productLineItem.price.value));
        var discountedPliPriceAfterPriceAdjustment;
        collections.forEach(productLineItem.priceAdjustments, function (priceAdjustment) {
            discountedPliPriceAfterPriceAdjustment = discountedPliPriceBeforePriceAdjustment.add(priceAdjustment.price);

            pli.priceAdjustments[priceAdjustment.UUID] = {
                discountedPliPriceBeforePriceAdjustment: discountedPliPriceBeforePriceAdjustment,
                discountedPliPriceAfterPriceAdjustment: discountedPliPriceAfterPriceAdjustment,
                discountedPrice: productLineItem.adjustedPrice,
                price: priceAdjustment.price,
                quantity: priceAdjustment.quantity,
                appliedDiscount: priceAdjustment.appliedDiscount
            };

            discountedPliPriceBeforePriceAdjustment = discountedPliPriceAfterPriceAdjustment.newMoney(new Decimal(discountedPliPriceAfterPriceAdjustment.value));

            var paKey = priceAdjustment.promotionID;
            if (!(paKey in originalDiscounts.priceAdjustments)) {
                originalDiscounts.priceAdjustments[paKey] = {
                    appliedQty: 0, totalAmount: 0, plis: [], qtys: {}
                };
            }

            originalDiscounts.priceAdjustments[paKey].appliedQty += priceAdjustment.quantity;
            originalDiscounts.priceAdjustments[paKey].totalAmount += (productLineItem.basePrice.multiply(priceAdjustment.quantity).add(priceAdjustment.price));
            originalDiscounts.priceAdjustments[paKey].plis.push(productLineItem.UUID);
            originalDiscounts.priceAdjustments[paKey].qtys[productLineItem.UUID] = priceAdjustment.quantity;
        });
        originalDiscounts.productLineItems[productLineItem.UUID] = pli;
    });
    // order discounts
    collections.forEach(this.priceAdjustments, function (priceAdjustment) {
        originalDiscounts.order[priceAdjustment.UUID] = {
            discountedPrice: this.getAdjustedMerchandizeTotalPrice(true),
            price: priceAdjustment.price,
            quantity: priceAdjustment.quantity,
            appliedDiscount: priceAdjustment.appliedDiscount
        };
    }, this);
    return originalDiscounts;
}

module.exports = function (object) {
    Object.defineProperties(object, {
        geCollectOriginalDiscountsData: {
            value: geCollectOriginalDiscountsData
        }
    });
};
