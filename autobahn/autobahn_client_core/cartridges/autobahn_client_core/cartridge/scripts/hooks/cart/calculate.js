'use strict';

var base = module.superModule;
var HookMgr = require('dw/system/HookMgr');
var collections = require('*/cartridge/scripts/util/collections');
var liveSellingPriceAdjustmentHelper = require('*/cartridge/scripts/helpers/liveSellingPriceAdjustmentHelper');

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
            if (liveSellingPriceAdjustmentHelper.syncLiveSellingPriceAdjustment(lineItem)) {
                adjustmentsChanged = true;
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

    applyLiveSellingAdjustments(basket);

    return result;
};

exports.applyLiveSellingAdjustments = applyLiveSellingAdjustments;
