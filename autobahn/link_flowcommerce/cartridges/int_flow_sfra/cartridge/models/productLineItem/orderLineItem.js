/* global empty:false */
'use strict';

var formatMoney = require('dw/util/StringUtils').formatMoney;
var Money = require('dw/value/Money');
var base = module.superModule;

/**
 * @param {ProductLineItem} lineItem - SFCC Order Line Item
 * @returns {boolean} Indicates if Order is a Flow or System order
 */
function hasFlowPrice(lineItem) {
    return ('flowPrice' in lineItem.custom && !empty(lineItem.custom.flowPrice));
}

/**
 * @param {ProductLineItem} lineItem - SFCC Order Line Item
 * @returns {string} The Formatted Money object
 */
function getFlowPrice(lineItem) {
    var object;

    if (hasFlowPrice(lineItem)) {
        try {
            object = JSON.parse(lineItem.custom.flowPrice);
        } catch (e) {
            object = null;
        }
    }

    return object ? formatMoney(new Money(object.amount, object.currency)) : '-';
}

/**
 * @param {ProductLineItem} lineItem - SFCC Order Line Item
 * @returns {string} The Formatted Money object
 */
function getFlowTotalPrice(lineItem) {
    var object;
    var perItemPrice;

    if (hasFlowPrice(lineItem)) {
        try {
            object = JSON.parse(lineItem.custom.flowPrice);
            perItemPrice = new Money(object.amount, object.currency);
        } catch (e) {
            object = null;
        }
    }

    return perItemPrice ? formatMoney(perItemPrice.multiply(lineItem.quantityValue)) : '-';
}

/**
 * Decorate product with product line item information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @returns {Object} - Decorated product model
 */
function orderLineItem(product, apiProduct, options) {
    base.call(this, product, apiProduct, options);

    Object.defineProperty(product, 'hasFlowPrice', {
        enumerable: true,
        value: hasFlowPrice(options.lineItem)
    });

    Object.defineProperty(product, 'flowPrice', {
        enumerable: true,
        value: getFlowPrice(options.lineItem)
    });

    Object.defineProperty(product, 'flowTotalPrice', {
        enumerable: true,
        value: getFlowTotalPrice(options.lineItem)
    });

    return product;
}

module.exports = orderLineItem;
