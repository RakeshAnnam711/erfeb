'use strict';

var base = module.superModule;
var HookMgr = require('dw/system/HookMgr');
var collections = require('*/cartridge/scripts/util/collections');
var liveSellingPriceAdjustmentHelper = require('*/cartridge/scripts/helpers/liveSellingPriceAdjustmentHelper');
var dwLogger = require('dw/system/Logger').getLogger('LiveSelling', 'CalculateHook');

/**
 * Synchronizes the live selling price adjustment on every line item in the basket, then re-runs just the
 * tax + totals recalculation (not the whole dw.order.calculate hook again, which would call back into
 * exports.calculate below) if anything actually changed. Extracted as its own function, independent of
 * module.superModule/base.calculate, specifically so it can be unit tested directly.
 * @param {dw.order.Basket} basket - The basket whose line items should be synchronized
 * @returns {boolean} True if any line item's adjustment was created, updated, or removed
 */
function applyLiveSellingAdjustments(basket) {
    var adjustmentsChanged = false;

    if (basket && basket.allProductLineItems) {
        collections.forEach(basket.allProductLineItems, function (lineItem) {
            // syncLiveSellingPriceAdjustment() already catches its own errors, but this loop touches every
            // line item in the basket on every recalculation site-wide - one bad line item must never stop
            // the rest from being processed, or block tax/totals recalculation for everything else.
            try {
                if (liveSellingPriceAdjustmentHelper.syncLiveSellingPriceAdjustment(lineItem)) {
                    adjustmentsChanged = true;
                }
            } catch (e) {
                dwLogger.error('Unexpected error synchronizing live selling price adjustment for line item {0}: {1}', lineItem && lineItem.UUID, e);
            }
        });
    }

    if (adjustmentsChanged) {
        HookMgr.callHook('dw.order.calculateTax', 'calculateTax', basket);
        basket.updateTotals();
    }

    return adjustmentsChanged;
}

exports.calculateTax = function (basket) {
    return base.calculateTax(basket);
};

/**
 * Wraps the base calculate hook (int_globale_sfra's Global-e integration, which unconditionally re-derives
 * every line item's base price from the default price model as part of every recalculation) to synchronize
 * the live selling price adjustment afterward. A price adjustment (not ProductLineItem.setPriceValue())
 * is used specifically because it survives Global-e's own recalculation - Global-e only resets the base
 * price, never touches manually-created adjustments - and because this recomputes the adjustment relative
 * to whatever the base price currently is, the final adjusted price stays correct on every pass regardless
 * of what Global-e just reset the base price to.
 * @param {dw.order.Basket} basket - The basket to calculate
 * @param {boolean} original - Passed straight through to the base calculate
 * @param {boolean} payByLinkScenario - Passed straight through to the base calculate
 * @returns {dw.system.Status} Whatever the base calculate returns
 */
exports.calculate = function (basket, original, payByLinkScenario) {
    var result = base.calculate(basket, original, payByLinkScenario);

    // Outermost safety net: base.calculate()'s result must always be returned regardless of what happens
    // in our own logic below. This hook runs on every basket recalculation across the entire site - it
    // must never be the reason checkout/payment breaks for a basket that has nothing to do with live
    // selling at all.
    try {
        applyLiveSellingAdjustments(basket);
    } catch (e) {
        dwLogger.error('Unexpected error applying live selling price adjustments for basket {0}: {1}', basket && basket.UUID, e);
    }

    return result;
};

exports.applyLiveSellingAdjustments = applyLiveSellingAdjustments;
