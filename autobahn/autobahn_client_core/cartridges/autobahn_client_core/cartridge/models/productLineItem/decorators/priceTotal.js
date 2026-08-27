'use strict';

var base = module.superModule;

// Adds a rounded percentOff to priceTotal, using the same pre/post-adjustment values the base decorator already computes nonAdjustedPrice from - covers any product-level price adjustment (coupon or live selling), not just live selling specifically.
module.exports = function (object, lineItem) {
    base(object, lineItem);

    try {
        if (lineItem.priceAdjustments.getLength() > 0) {
            var nonAdjustedValue = lineItem.getPrice() && lineItem.getPrice().available ? lineItem.getPrice().value : 0;
            var adjustedValue = lineItem.adjustedPrice && lineItem.adjustedPrice.available ? lineItem.adjustedPrice.value : 0;

            if (nonAdjustedValue > 0 && adjustedValue < nonAdjustedValue) {
                object.priceTotal.percentOff = Math.round(((nonAdjustedValue - adjustedValue) / nonAdjustedValue) * 100);
            }
        }
    } catch (e) {
        // Leave percentOff unset on any error - the price display itself must not break.
    }
};
