'use strict';

var base = module.superModule;
var globaleSession = require('*/cartridge/models/globale/session');
var Order = require('dw/order/Order');
var Basket = require('dw/order/Basket');
var Money = require('dw/value/Money');
var globaleHelpers = require('*/cartridge/scripts/helpers/globaleHelpers');
var collections = require('*/cartridge/scripts/util/collections');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var globaleMoney = require('*/cartridge/scripts/factories/globale/money');
var template = 'checkout/productCard/productCardProductRenderedTotalPrice';

/**
 * Returns line item price (without discoutns)
 * @param {dw.order.ProductLineItem} lineItem - product line item
 * @returns {dw.value.Money} - line item price (without discoutns)
 */
function getLineItemPrice(lineItem) {
    var lineItemCtnr = lineItem.lineItemCtnr;
    var price = lineItem.price;

    if (lineItemCtnr instanceof Basket) {
        return price;
    }

    if (
        (globaleHelpers.customAttr.productLineItem.geInternationalPrice in lineItem.custom)
        && (lineItem.custom[globaleHelpers.customAttr.productLineItem.geInternationalPrice] !== null)
    ) {
        price = (Number(lineItem.custom[globaleHelpers.customAttr.productLineItem.geInternationalPrice]) * lineItem.quantityValue);
        price = new Money(price, lineItem.price.currencyCode);
    }

    return price;
}

/**
 * Returns line item price (with discoutns)
 * @param {dw.order.ProductLineItem} lineItem - product line item
 * @returns {dw.value.Money} - line item price (with discoutns)
 */
function getLineItemAdjustedPrice(lineItem) {
    var lineItemCtnr = lineItem.lineItemCtnr;
    var price = lineItem.adjustedPrice;

    if (lineItemCtnr instanceof Basket) {
        return price;
    }

    if (
        (globaleHelpers.customAttr.productLineItem.geInternationalPrice in lineItem.custom)
        && (lineItem.custom[globaleHelpers.customAttr.productLineItem.geInternationalPrice] !== null)
    ) {
        price = (Number(lineItem.custom[globaleHelpers.customAttr.productLineItem.geInternationalPrice]) * lineItem.quantityValue);

        collections.forEach(lineItem.priceAdjustments, function (priceAdjustment) {
            if (
                (globaleHelpers.customAttr.priceAdjustment.geInternationalPrice in priceAdjustment.custom)
                && (priceAdjustment.custom[globaleHelpers.customAttr.priceAdjustment.geInternationalPrice] !== null)
            ) {
                price -= Number(priceAdjustment.custom[globaleHelpers.customAttr.priceAdjustment.geInternationalPrice]);
            }
        });

        price = new Money(price, lineItem.adjustedPrice.currencyCode);
    }

    return price;
}

/**
 * Get the total price for the product line item from Order
 * @param {dw.order.ProductLineItem} lineItem - API ProductLineItem instance
 * @returns {Object} an object containing the product line item total info.
 */
function getTotalPrice(lineItem) {
    var lineItemCtnr = lineItem.lineItemCtnr;
    var currencyCode = lineItemCtnr instanceof Basket ?
        globaleSession.get('geCurrency') :
        lineItem.lineItemCtnr.custom[globaleHelpers.customAttr.order.geCustomerCurrencyCode];
    var price = getLineItemAdjustedPrice(lineItem);
    var nonAdjustedPrice = getLineItemPrice(lineItem);
    var result = {};

    // The platform does not include prices for selected option values in a line item product's
    // price by default. So, we must add the option price to get the correct line item total price.
    collections.forEach(lineItem.optionProductLineItems, function (item) {
        price = price.add(getLineItemAdjustedPrice(item));
        nonAdjustedPrice = nonAdjustedPrice.add(getLineItemPrice(item));
    });

    if (price.available) {
        price = globaleMoney(price, currencyCode);
    }
    if (nonAdjustedPrice.available) {
        nonAdjustedPrice = globaleMoney(nonAdjustedPrice, currencyCode);
    }
    if (price.valueOrNull !== nonAdjustedPrice.valueOrNull) {
        result.nonAdjustedPrice = nonAdjustedPrice.toFormattedString();
    }

    result.price = price.toFormattedString();
    result.renderedPrice = renderTemplateHelper.getRenderedHtml({ lineItem: { priceTotal: result } }, template);

    return result;
}

module.exports = function (object, lineItem) {
    var lineItemCtnr = lineItem.lineItemCtnr;
    // defines isGlobaleBasket
    var isGlobaleBasket = false;
    if (
        lineItemCtnr
        && (lineItemCtnr instanceof Basket)
        && globaleSession.get('geOperatedCountry')
    ) {
        isGlobaleBasket = true;
    }
    // defines isGlobaleOrder
    var isGlobaleOrder = false;
    if (
        lineItemCtnr
        && (lineItemCtnr instanceof Order)
        && (globaleHelpers.customAttr.order.geOrderNumber in lineItemCtnr.custom)
        && (lineItemCtnr.custom[globaleHelpers.customAttr.order.geOrderNumber] !== null)
    ) {
        isGlobaleOrder = true;
    }
    // defines priceTotal
    if (isGlobaleOrder || isGlobaleBasket) {
        Object.defineProperty(object, 'priceTotal', {
            enumerable: true,
            value: getTotalPrice(lineItem)
        });
    } else {
        base.apply(this, Array.prototype.slice.call(arguments));
    }
};
