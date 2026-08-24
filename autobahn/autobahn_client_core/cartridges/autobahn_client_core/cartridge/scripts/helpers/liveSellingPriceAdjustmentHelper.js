'use strict';

var AmountDiscount = require('dw/campaign/AmountDiscount');
var liveSellingPriceHelper = require('*/cartridge/scripts/helpers/liveSellingPriceHelper');
var dwLogger = require('dw/system/Logger').getLogger('LiveSelling', 'PriceAdjustment');

var ADJUSTMENT_ID = 'live-selling-price-override';

function getCustomBoolean(lineItem, attributeID) {
    try {
        return !!(lineItem && lineItem.custom && lineItem.custom[attributeID]);
    } catch (e) {
        return false;
    }
}

function getCustomBooleanTriState(lineItem, attributeID) {
    try {
        if (!lineItem || !lineItem.custom || !(attributeID in lineItem.custom)) {
            return undefined;
        }

        var value = lineItem.custom[attributeID];

        if (value === null || value === undefined) {
            return undefined;
        }

        return !!value;
    } catch (e) {
        return undefined;
    }
}

// Stricter than the cart-locking check elsewhere - both isCSCHandoffLineItem and isLiveSellingLineItem must be explicitly true, since this drives a real money change.
function isEligibleForOverride(lineItem) {
    return getCustomBoolean(lineItem, 'isCSCHandoffLineItem') && getCustomBooleanTriState(lineItem, 'isLiveSellingLineItem') === true;
}

function getExistingAdjustment(lineItem) {
    try {
        return lineItem.getPriceAdjustmentByPromotionID(ADJUSTMENT_ID);
    } catch (e) {
        return null;
    }
}

// Uses a price adjustment instead of ProductLineItem.setPriceValue() because Global-e's dw.order.calculate resets the base price on every pass - an adjustment survives that reset since it's recomputed relative to whatever the base price currently is.
function syncLiveSellingPriceAdjustment(lineItem) {
    if (!lineItem) {
        return false;
    }

    // Runs on every basket recalculation site-wide, so an uncaught error here must never break checkout for the whole site.
    try {
        var existingAdjustment = getExistingAdjustment(lineItem);
        var eligible = isEligibleForOverride(lineItem);
        var liveSellingPrice = eligible ? liveSellingPriceHelper.getLiveSellingPrice(lineItem.product) : null;

        // Not eligible or no valid live selling price - remove any existing adjustment so the item falls back to normal pricing.
        if (!liveSellingPrice) {
            if (existingAdjustment) {
                lineItem.removePriceAdjustment(existingAdjustment);
                return true;
            }

            return false;
        }

        var quantity = lineItem.quantityValue || 1;
        // lineItem.price is the TOTAL for the full quantity, not a unit price - must multiply liveSellingPrice by quantity, or this is wrong at qty 2+.
        var currentLineItemTotal = lineItem.price;

        if (!currentLineItemTotal || !currentLineItemTotal.available) {
            return false;
        }

        var targetLineItemTotal = liveSellingPrice.multiply(quantity);
        var targetAdjustmentTotal = targetLineItemTotal.subtract(currentLineItemTotal);

        if (existingAdjustment) {
            if (!existingAdjustment.price || !existingAdjustment.price.equals(targetAdjustmentTotal)) {
                existingAdjustment.setPriceValue(targetAdjustmentTotal.value);
                return true;
            }

            return false;
        }

        // AmountDiscount's constructor value is overridden right after via setPriceValue() - but a zero/non-positive amount is rejected by the platform, so pass the real discount instead.
        var discountAmount = currentLineItemTotal.subtract(targetLineItemTotal).value;
        var newAdjustment = lineItem.createPriceAdjustment(ADJUSTMENT_ID, new AmountDiscount(discountAmount > 0 ? discountAmount : 0.01));
        newAdjustment.setPriceValue(targetAdjustmentTotal.value);
        return true;
    } catch (e) {
        dwLogger.error('Failed to synchronize live selling price adjustment for line item {0}: {1}', lineItem.UUID, e);
        return false;
    }
}

// Read-only for use after payment authorization (doPrePlaceOrder's safety net) - mutating totals here would change the order total after the processor already authorized a specific amount.
function isAdjustmentCorrect(lineItem) {
    if (!lineItem) {
        return true;
    }

    var existingAdjustment = getExistingAdjustment(lineItem);
    var eligible = isEligibleForOverride(lineItem);
    var liveSellingPrice = eligible ? liveSellingPriceHelper.getLiveSellingPrice(lineItem.product) : null;

    if (!liveSellingPrice) {
        return !existingAdjustment;
    }

    if (!existingAdjustment) {
        return false;
    }

    var quantity = lineItem.quantityValue || 1;
    // Same total-vs-unit correction as syncLiveSellingPriceAdjustment() above.
    var currentLineItemTotal = lineItem.price;

    if (!currentLineItemTotal || !currentLineItemTotal.available) {
        return false;
    }

    var targetAdjustmentTotal = liveSellingPrice.multiply(quantity).subtract(currentLineItemTotal);

    return !!(existingAdjustment.price && existingAdjustment.price.equals(targetAdjustmentTotal));
}

module.exports = {
    ADJUSTMENT_ID: ADJUSTMENT_ID,
    isEligibleForOverride: isEligibleForOverride,
    isAdjustmentCorrect: isAdjustmentCorrect,
    syncLiveSellingPriceAdjustment: syncLiveSellingPriceAdjustment
};
