'use strict';

/* The purpose of this file is to provide the base functions that can be used by SOM,
but that also can be easily overridden by a client implementation to return data that
is more relevant for that client. */

/* Public Method declarations */
exports.GetOrderCheckoutStorefront = getOrderCheckoutStorefront;
exports.GetProductLineItemBrandId = getProductLineItemBrandId;

/* Public Method Definitions */
/**
 * This function looks at the current order and returns the value that should be set in the
 * custom attribute "CheckoutStorefront" on this order.
 * @param {dw.order.Order} order : the order that was just created and is finishing the checkout process
 * @returns {String} A string value representing the storefront that this order was placed on.
 * @example This function is called in the append to CheckoutServices-PlaceOrder in this cartridge.
 * The value returned from this function is saved in the custom attribute "CheckoutStorefront" on the
 * SFCC Order object.
 * This is needed as a custom attribute because many of the OOTB attributes on the Order object are not
 * available to SOM once the order was been imported from SFCC. SOM will then be able to use this value in reporting.
 *
 * This data is most relevant when there are multiple brands hosted from a single storefront.
 * If an implementation has multiple brands, but a single brand per storefront (site), then this data may not be
 * needed and/or might just return the siteId.
 */
function getOrderCheckoutStorefront(order) {
	return order.sourceCode;
}

/**
 * This function looks at the current product line item and returns the value that should be set in the
 * custom attribute "BrandId" on this same product line item.
 * @param {dw.order.ProductLineItem} productLineItem : the product line item currently being iterated over
 * @returns {String} A string value representing the brand of this product
  * @example This function is called in the append to CheckoutServices-PlaceOrder in this cartridge.
 * The value returned from this function is saved in the custom attribute "BrandId" on the
 * SFCC ProductLineItem object.
 * This is needed as a custom attribute because many of the OOTB attributes on the Product object are not
 * available to SOM once the order was been imported from SFCC. SOM will then be able to use this value in reporting.
 *
 * This data is most relevant when there are multiple brands sold from a single storefront.
 * If an implementation has multiple brands on a storefront (site), then this data is useful for reporting in SON
 *
 * This is also a function that may need to be overridden in a client cartridge to return the value from a
 * different attribute, likely a custom one, on the Product object.
 */
function getProductLineItemBrandId(productLineItem) {
	return productLineItem.product && !empty(productLineItem.product.brand) ? productLineItem.product.brand : '';
}

module.exports = exports;
