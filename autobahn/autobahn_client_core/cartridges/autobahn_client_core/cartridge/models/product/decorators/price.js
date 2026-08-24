'use strict';

var priceFactory = require('*/cartridge/scripts/factories/price');
var priceHelper = require('*/cartridge/scripts/helpers/pricing');

/**
  * Renders pricing template for line item
  * @param {Object} price - Factory price
  * @return {string} - Rendered HTML
  */
function getRenderedPrice(price) {
    var context = {
        price: price
    };
    return priceHelper.renderHtml(priceHelper.getHtmlContext(context));
}

/**
 * Same as the base app_storefront_base price decorator, except price/renderedPrice are defined as
 * configurable. The base decorator locks them as non-configurable (Object.defineProperty with no
 * configurable flag), which throws "Cannot modify readonly property" if anything downstream - here,
 * productLineItem.js, to substitute the correct price for an explicitly live selling line item - tries to
 * redefine them afterward. Fully replicates the base decorator's own logic rather than chaining to it,
 * since the lock happens inside the base call itself and can't be relaxed after the fact.
 */
module.exports = function (object, product, promotions, useSimplePrice, currentOptions) {
    Object.defineProperty(object, 'price', {
        configurable: true,
        enumerable: true,
        value: priceFactory.getPrice(product, null, useSimplePrice, promotions, currentOptions)
    });
    Object.defineProperty(object, 'renderedPrice', {
        configurable: true,
        enumerable: true,
        value: getRenderedPrice(object.price)
    });
};
