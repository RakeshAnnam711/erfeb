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

    // The base price decorator (productDecorators.price, via factories/price.js) computes product.price
    // fresh from the product's own default price model - it has no concept of a line item's actual charged
    // price (base price + adjustments), so the live selling price adjustment applied by the dw.order.calculate
    // hook never shows up here on its own. Overwriting it directly is the only way the displayed unit price
    // matches what the customer actually gets charged (the basket subtotal/total already reflect it
    // correctly, since those sum the line item's real adjusted price, not this decorator's output). Requires
    // our own decorators/price.js override (configurable: true) - the base decorator locks price/renderedPrice
    // as non-configurable, and a plain assignment can't change that either since it's also non-writable.
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
