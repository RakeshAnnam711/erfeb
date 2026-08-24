'use strict';

var base = module.superModule;
var agentLocks = require('*/cartridge/scripts/helpers/agentBasketLineItemLocks');
var liveSellingPriceHelper = require('*/cartridge/scripts/helpers/liveSellingPriceHelper');
var liveSellingPriceAdjustmentHelper = require('*/cartridge/scripts/helpers/liveSellingPriceAdjustmentHelper');
var DefaultPrice = require('*/cartridge/models/price/default');
var priceHelper = require('*/cartridge/scripts/helpers/pricing');

function getRenderedPrice(price) {
    return priceHelper.renderHtml(priceHelper.getHtmlContext({ price: price }));
}

module.exports = function productLineItem(product, apiProduct, options) {
    base.call(this, product, apiProduct, options);
    agentLocks.decorateProductLineItem(product, options.lineItem);

    // The base price decorator computes purely from the product's default price model, so the live selling adjustment never shows up here on its own - overwrite it directly (needs decorators/price.js's configurable: true).
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

    return product;
};
