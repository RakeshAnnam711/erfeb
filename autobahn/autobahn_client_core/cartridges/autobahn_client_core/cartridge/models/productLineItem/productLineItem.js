'use strict';

var base = module.superModule;
var agentLocks = require('*/cartridge/scripts/helpers/agentBasketLineItemLocks');
var liveSellingPriceHelper = require('*/cartridge/scripts/helpers/liveSellingPriceHelper');
var liveSellingPriceAdjustmentHelper = require('*/cartridge/scripts/helpers/liveSellingPriceAdjustmentHelper');
var DefaultPrice = require('*/cartridge/models/price/default');
var priceHelper = require('*/cartridge/scripts/helpers/pricing');
var dwLogger = require('dw/system/Logger').getLogger('LiveSelling', 'ProductLineItem');

function getRenderedPrice(price) {
    return priceHelper.renderHtml(priceHelper.getHtmlContext({ price: price }));
}

module.exports = function productLineItem(product, apiProduct, options) {
    base.call(this, product, apiProduct, options);
    agentLocks.decorateProductLineItem(product, options.lineItem);

    // The base price decorator computes purely from the product's default price model, so the live selling adjustment never shows up here on its own - overwrite it directly (needs decorators/price.js's configurable: true). Wrapped in try/catch since this runs for every line item on every cart/checkout render - a live-selling-specific failure here must never break line item model construction for the whole page.
    try {
        if (options.lineItem && liveSellingPriceAdjustmentHelper.isEligibleForOverride(options.lineItem)) {
            var liveSellingPrice = liveSellingPriceHelper.getLiveSellingPrice(apiProduct);

            if (liveSellingPrice) {
                var overriddenPrice = new DefaultPrice(liveSellingPrice, null);

                Object.defineProperty(product, 'price', {
                    configurable: true,
                    enumerable: true,
                    value: overriddenPrice
                });
                Object.defineProperty(product, 'renderedPrice', {
                    configurable: true,
                    enumerable: true,
                    value: getRenderedPrice(overriddenPrice)
                });
            }
        }
    } catch (e) {
        dwLogger.error('Failed to apply live selling price override for line item {0}: {1}', options.lineItem && options.lineItem.UUID, e);
    }

    return product;
};
