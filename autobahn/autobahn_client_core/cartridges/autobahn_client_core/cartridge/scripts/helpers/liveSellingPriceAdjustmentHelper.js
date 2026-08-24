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

/**
 * Deliberately stricter than the cart-locking definition used elsewhere (no category fallback) - this
 * drives a real money change, so it should only ever happen from the agent's explicit checkbox: both
 * isCSCHandoffLineItem and isLiveSellingLineItem === true, not just one, and not an inferred/fallback state.
 * @param {dw.order.ProductLineItem} lineItem - The line item to check
 * @returns {boolean} True only if the agent explicitly marked this CSC line item as live selling
 */
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

/**
 * Creates, updates, or removes the live selling price adjustment on a single line item so its adjusted
 * (effective) price always equals the live selling price book's price, regardless of whatever the
 * underlying base price currently is. A price adjustment is used instead of ProductLineItem.setPriceValue()
 * because Global-e's own recalculation (int_globale_sfra's dw.order.calculate hook) resets the base price
 * on every pass - repeatedly calling setPriceValue() after that reset is a losing race. A price adjustment
 * survives that reset (Global-e only touches the base price, not manually-created adjustments), and since
 * this recomputes the adjustment relative to whatever the base price currently is, the final adjusted price
 * stays correct even if the base price keeps getting reset out from under it.
 * @param {dw.order.ProductLineItem} lineItem - The line item to synchronize
 * @returns {boolean} True if this call created, updated, or removed an adjustment (i.e. something changed)
 */
function syncLiveSellingPriceAdjustment(lineItem) {
    if (!lineItem) {
        return false;
    }

    // Everything below mutates real order/basket state (creating, updating, or removing a price
    // adjustment). This runs on every basket recalculation site-wide via the dw.order.calculate hook, so
    // an uncaught exception here - for any reason, on any line item, live selling or not - would break
    // basket calculation for the entire checkout flow, not just this feature. Never let that happen.
    try {
        var existingAdjustment = getExistingAdjustment(lineItem);
        var eligible = isEligibleForOverride(lineItem);
        var liveSellingPrice = eligible ? liveSellingPriceHelper.getLiveSellingPrice(lineItem.product) : null;

        // Not eligible, or eligible but the product has no valid price in the live selling price book -
        // remove any existing adjustment (checkbox unchecked, item un-marked as CSC, or price book entry
        // removed) so the line item falls back to whatever the normal price resolution gives it.
        if (!liveSellingPrice) {
            if (existingAdjustment) {
                lineItem.removePriceAdjustment(existingAdjustment);
                return true;
            }

            return false;
        }

        var quantity = lineItem.quantityValue || 1;
        // lineItem.price is the TOTAL price for the full line item quantity, not a unit price -
        // liveSellingPrice (from the price book lookup) is a unit price, so it must be multiplied by
        // quantity before comparing against/subtracting from lineItem.price. Getting this wrong is
        // invisible at quantity 1 (unit and total are numerically identical) and only shows up as a wrong
        // discount at quantity 2+.
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

        // AmountDiscount's constructor value is only used to create the adjustment - the actual price is
        // overridden immediately after via setPriceValue() below - but a zero/non-positive amount here
        // appears to be rejected by the platform, so pass the real total difference (always positive in
        // the discount case) rather than a throwaway placeholder.
        var discountAmount = currentLineItemTotal.subtract(targetLineItemTotal).value;
        var newAdjustment = lineItem.createPriceAdjustment(ADJUSTMENT_ID, new AmountDiscount(discountAmount > 0 ? discountAmount : 0.01));
        newAdjustment.setPriceValue(targetAdjustmentTotal.value);
        return true;
    } catch (e) {
        dwLogger.error('Failed to synchronize live selling price adjustment for line item {0}: {1}', lineItem.UUID, e);
        return false;
    }
}

/**
 * Read-only check for use after payment has already been authorized (doPrePlaceOrder's safety net) - never
 * creates, updates, or removes anything. Mutating an order's price adjustments/totals at that point would
 * change the order total after the payment processor already authorized a specific amount against it,
 * which is exactly what caused checkout to start rejecting payments as invalid once the active safety net
 * (which called setPriceValue/updateTotals here) was tried. This only reports whether things look right, so
 * the caller can log a warning for a human to investigate instead of silently changing a paid-for total.
 * @param {dw.order.ProductLineItem} lineItem - The line item to check
 * @returns {boolean} True if this line item's price adjustment already matches what it should be (including
 *   correctly having none, for a non-eligible or unpriced line item)
 */
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
    // Same total-vs-unit correction as syncLiveSellingPriceAdjustment() above - lineItem.price is the
    // full-quantity total, liveSellingPrice is a unit price.
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
