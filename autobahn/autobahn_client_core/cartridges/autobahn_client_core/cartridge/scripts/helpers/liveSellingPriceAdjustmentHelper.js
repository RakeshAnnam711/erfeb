'use strict';

var AmountDiscount = require('dw/campaign/AmountDiscount');
var liveSellingPriceHelper = require('*/cartridge/scripts/helpers/liveSellingPriceHelper');
var agentBasketLineItemLocks = require('*/cartridge/scripts/helpers/agentBasketLineItemLocks');
var dwLogger = require('dw/system/Logger').getLogger('LiveSelling', 'PriceAdjustment');

var ADJUSTMENT_ID = 'live-selling-price-override';

function getCustomBoolean(lineItem, attributeID) {
    try {
        return !!lineItem.custom[attributeID];
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

// Business Manager baskets need the channel check before storefront locks are initialized.
function isEligibleForOverride(lineItem) {
    if (getCustomBooleanTriState(lineItem, 'isLiveSellingLineItem') !== true) {
        return false;
    }

    if (getCustomBoolean(lineItem, 'isCSCHandoffLineItem')) {
        return true;
    }

    var lineItemCtnr = lineItem.lineItemCtnr;
    return !!lineItemCtnr && (agentBasketLineItemLocks.isAgentBasket(lineItemCtnr) || agentBasketLineItemLocks.isCustomerServiceCenterBasket(lineItemCtnr));
}

function getExistingAdjustment(lineItem) {
    try {
        return lineItem.getPriceAdjustmentByPromotionID(ADJUSTMENT_ID);
    } catch (e) {
        return null;
    }
}

// Use an adjustment because Global-e resets the line item's base price during calculation.
function syncLiveSellingPriceAdjustment(lineItem) {
    if (!lineItem) {
        return false;
    }

    // Pricing failures must not block basket calculation.
    try {
        var existingAdjustment = getExistingAdjustment(lineItem);
        var eligible = isEligibleForOverride(lineItem);
        var liveSellingPrice = eligible ? liveSellingPriceHelper.getLiveSellingPrice(lineItem.product) : null;

        // Remove stale adjustments when the item is no longer eligible.
        if (!liveSellingPrice) {
            if (existingAdjustment) {
                lineItem.removePriceAdjustment(existingAdjustment);
                return true;
            }

            return false;
        }

        var quantity = lineItem.quantityValue || 1;
        // lineItem.price is the total for all units.
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

        // AmountDiscount requires a positive value even though setPriceValue updates it below.
        var discountAmount = currentLineItemTotal.subtract(targetLineItemTotal).value;
        var newAdjustment = lineItem.createPriceAdjustment(ADJUSTMENT_ID, new AmountDiscount(discountAmount > 0 ? discountAmount : 0.01));
        newAdjustment.setPriceValue(targetAdjustmentTotal.value);
        return true;
    } catch (e) {
        dwLogger.error('Failed to synchronize live selling price adjustment for line item {0}: {1}', lineItem.UUID, e);
        return false;
    }
}

// Validate only; payment has already been authorized when this runs.
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
    // Compare full-quantity totals.
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
