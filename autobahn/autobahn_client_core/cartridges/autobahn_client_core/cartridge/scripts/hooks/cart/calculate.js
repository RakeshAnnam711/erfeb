'use strict';

var base = module.superModule;
var HookMgr = require('dw/system/HookMgr');
var collections = require('*/cartridge/scripts/util/collections');
var liveSellingPriceAdjustmentHelper = require('*/cartridge/scripts/helpers/liveSellingPriceAdjustmentHelper');
var dwLogger = require('dw/system/Logger').getLogger('LiveSelling', 'CalculateHook');

// Recalculate tax and totals when a live-selling adjustment changes.
function applyLiveSellingAdjustments(basket) {
    var adjustmentsChanged = false;

    if (basket && basket.allProductLineItems) {
        collections.forEach(basket.allProductLineItems, function (lineItem) {
            // One bad line item must never stop the rest from being processed or block tax/totals recalc for everything else.
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

// Apply live-selling adjustments after the base calculation resets line-item prices.
exports.calculate = function (basket, original, payByLinkScenario) {
    var result = base.calculate(basket, original, payByLinkScenario);

    // Preserve the base hook result if adjustment processing fails.
    try {
        applyLiveSellingAdjustments(basket);
    } catch (e) {
        dwLogger.error('Unexpected error applying live selling price adjustments for basket {0}: {1}', basket && basket.UUID, e);
    }

    return result;
};

exports.applyLiveSellingAdjustments = applyLiveSellingAdjustments;
