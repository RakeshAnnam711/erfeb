'use strict';

var priceFactory = require('*/cartridge/scripts/factories/price');
var priceHelper = require('*/cartridge/scripts/helpers/pricing');

// Renders the pricing template for a line item.
function getRenderedPrice(price) {
    var context = {
        price: price
    };
    return priceHelper.renderHtml(priceHelper.getHtmlContext(context));
}

// Same as the base decorator, but price/renderedPrice are configurable, so productLineItem.js can redefine them for a live selling line item without hitting "Cannot modify readonly property".
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
