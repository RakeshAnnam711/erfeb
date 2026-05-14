/*  This file contains functions that assist with providing data that is uploaded to
	Marketing Cloud from the client side collect.js script file.
*/

'use strict'

var EventTypes = require('~/cartridge/scripts/constants/CollectConstants').EventTypes;

/* ***** Public Method declarations ***** */
exports.GetMetadata = getMetadata;
exports.LoadCartInfo = loadCartInfo;

/* ***** Public Functions definitions ***** */
/**
 * Gets the metadata on the initial load of a page. This is called from the beforeHeader hook implementation
 * and could be considered step 2 of the process that loads SFMC related metadata on to the page.
 * @param {Object} pdict: The pipeline dictionary coming from the beforeHeader hook implementation.
 * @param {*} accountId : The accountId (MID) for the SFMC business unit that is being communicated with.
 * @returns
 */
function getMetadata(pdict, currentRequest, accountId) {
	var collectInfos = [];
	// All metadata loads get the Account (MID) added to the event push
	collectInfos.push(getAccountIdInfo(accountId));

	var action = pdict.action;
	switch (action) {
		case "Account-Show":
		case "Login-Show":
			loadUserInfo(pdict, collectInfos);
			collectInfos.push([EventTypes.TrackPageView]);
			break;
		case "Checkout-Begin":
		case "Cart-Show":
			loadUserInfo(pdict, collectInfos);
			loadCartInfo(collectInfos);
			break;
		case "Order-Confirm":
			loadUserInfo(pdict, collectInfos);
			loadOrderInfo(pdict, collectInfos);
			break;
		case "Product-Show":
		case "Product-ShowInCategory":
			loadUserInfo(pdict, collectInfos);
			loadProductInfo(pdict, collectInfos);
			break;
		case "Search-Show":
			loadUserInfo(pdict, collectInfos);
			loadCategoryOrSearchInfo(currentRequest, pdict, collectInfos);
			break;
		case "Wishlist-Show":
		default:
			loadUserInfo(pdict, collectInfos);
			collectInfos.push([EventTypes.TrackPageView]);
	}

	return collectInfos;
}

/**
 * Puts info from the current basket into the array that will be sent to SFMC client side.
 * @param {Array} collectInfos: The array to add to.
 * @example The value added to the array will look something like this:
 *      _etmc.push(["trackCart", { "cart": [{
 *          "item": "masterProductId", "quantity":  "1", "price": "120.00", "unique_id": "variantProductId" }]
 *        }]);
 */
 function loadCartInfo(collectInfos) {
	var basketMgr = require('dw/order/BasketMgr');
	var basket = basketMgr.getCurrentOrNewBasket();
	var lineItemInfos = [];
	for (let index = 0; index < basket.productLineItems.length; index++) {
		let productLineItem = basket.productLineItems[index];
		if (productLineItem.product) {
			var lineItemInfo = getProductLineItemInfo(productLineItem);
			lineItemInfos.push(lineItemInfo);
		}
	}

	if (lineItemInfos.length > 0) {
		collectInfos.push([EventTypes.TrackCart, {"cart": lineItemInfos}]);
	}
}

/* ***** Private Functions ***** */

/**
 * Creates an array with the account data in it.
 * @param {String} accountId : The SFMC account identifier, also known as the MID
 * @example The array should look something like this when pushed to SFMC from the client side:
 *  _etmc.push(["setOrgId", "M534003197"]);
 * @returns {Array} that can be pushed to SFMC
 */
function getAccountIdInfo(accountId) {
	var infoArray = [];
	infoArray.push(EventTypes.SetOrgId);
	infoArray.push(accountId);

	return infoArray;
}

/**
 * Puts info from the current order into the array that will be sent to SFMC client side.
 * @param {Array} collectInfos: The array to add to.
 * @example The value added to the array will look something like this:
 *      _etmc.push(["trackConversion", { "cart": [{
 *          "item": "masterProductId", "quantity":  "1", "price": "120.00", "unique_id": "variantProductId" }],
 *           "order_number": "00001234"
 *       }]);
 */
function loadOrderInfo(pdict, collectInfos) {
	if (pdict.order !== null && pdict.order.items !== null && pdict.order.items.items !== null) {
		var lineItemInfos = [];
		for (var index = 0; index < pdict.order.items.items.length; index++) {
			var orderLineItem = pdict.order.items.items[index];
			var orderItemInfo = getOrderLineItemInfo(orderLineItem);
			lineItemInfos.push(orderItemInfo);
		}

		if (lineItemInfos.length > 0) {
			collectInfos.push([EventTypes.TrackConversion, { "cart": lineItemInfos, "order_number": pdict.order.orderNumber}]);
		}
	}

}

function getProductLineItemInfo(productLineItem) {
	var productHelper = require('~/cartridge/scripts/helpers/ProductHelper');
	return getItemInfo(
		productHelper.GetMasterProductId(productLineItem.product),
		productLineItem.quantityValue.toString(),
		productLineItem.basePrice.value.toString(),
		productLineItem.product.ID
	);
}

function getOrderLineItemInfo(orderLineItem) {
	var masterProductId = '';
	var price = '';
	if (orderLineItem.gtmData) {
		masterProductId = orderLineItem.gtmData.id;
		price = orderLineItem.gtmData.price;
	}

	return getItemInfo(masterProductId, orderLineItem.quantity.toString(), price, orderLineItem.id);
}

function getItemInfo(item, quantity, price, uniqueId) {
	return {
		"item": item,
		"quantity": quantity,
		"price": price,
		"unique_id": uniqueId
	};
}

/**
 * Puts info from the current CLP or Search into the array that will be sent to SFMC client side.
 * @param {Array} collectInfos: The array to add to.
 * @example The value added to the array will look something like this:
 *      _etmc.push(["trackPageView", { "category": "Outerwear Bottoms" }]);
 *       OR
 *      _etmc.push(["trackPageView", { "search": "cold weather socks" }]);
 */
function loadCategoryOrSearchInfo(currentRequest, pdict, collectInfos) {
	if (Object.hasOwnProperty.call(currentRequest.httpParameterMap, 'q') && currentRequest.httpParameterMap.q.value !== null) {
		var searchTerm = currentRequest.httpParameterMap.q.value;
		collectInfos.push([EventTypes.TrackPageView, { "search": searchTerm }]);
	} else {
		var cgidIndex = typeof pdict.queryString === 'string' ? pdict.queryString.indexOf('cgid') : pdict.queryString.cgid;
		if (cgidIndex > -1) {
			// WGACA MODIFICATION - index + 5 ->'cgid='
			// var beginCgid = pdict.queryString.substr(cgidIndex);
			var beginCgid = pdict.queryString.substr(cgidIndex + 5);
			var ampersandIndex = beginCgid.indexOf('&');
			var categoryId = beginCgid;
			if (ampersandIndex > -1) {
				categoryId = beginCgid.substr(5, ampersandIndex - 5);
			}
			var catalogMgr = require('dw/catalog/CatalogMgr');
			var category = catalogMgr.getCategory(categoryId);
			if (category) {
				collectInfos.push([EventTypes.TrackPageView, { "category": category.displayName }]);
			} else {
				var logger = require('dw/system/Logger');
				logger.error('loadCategoryOrSearchInfo: ' + cgidIndex + ' ' + beginCgid + ' ' + ampersandIndex + ' ' + categoryId);
			}
		}
	}
}

/**
 * Puts info from the current PDP into the array that will be sent to SFMC client side.
 * @param {Array} collectInfos: The array to add to.
 * @example The value added to the array will look something like this:
 *      _etmc.push(["trackPageView", { "item": "variantProductId" }]);
 */
function loadProductInfo(pdict, collectInfos) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var productId = pdict && pdict.product && pdict.product.id;

	if (productId) {
        var product = ProductMgr.getProduct(productId);
		var master = product && product.variant ? product.masterProduct : null;

		if (empty(master)) {
			collectInfos.push([EventTypes.TrackPageView, { "item": productId }]);
		} else  {
			collectInfos.push([EventTypes.TrackPageView, { "item": master.ID, "unique_id": productId}]);
		}
	}
}

/**
 * Puts info for the current customer into the array that will be sent to SFMC client side.
 * @param {Array} collectInfos: The array to add to.
 * @example The value added to the array will look something like this:
 *      _etmc.push(["setUserInfo", {
 *          "email": "email-or-contactId",
 *          "details": { "locale": "en_US", gender: "Male" }
 *       }]);
 */
function loadUserInfo(pdict, collectInfos) {
	if (pdict.CurrentUser && pdict.CurrentUser.profile) {
		var profile = pdict.CurrentUser.profile;
		var locale = profile.preferredLocale ? profile.preferredLocale : '';
		var gender = profile.gender ? profile.gender.displayValue : '';
		var email = profile.email ? profile.email : '';
		var contactId = '';
		if (Object.hasOwnProperty.call(profile.custom, 'b2ccrm_contactId') && !empty(profile.custom.b2ccrm_contactId)) {
			contactId = profile.custom.b2ccrm_contactId;
		}
		var uniqueId = !empty(contactId) ? contactId : email;
		collectInfos.push([EventTypes.SetUserInfo, {
			"email": uniqueId,
			"details": { "locale": locale, "gender": gender }
		}]);
		//collectInfos.push([EventTypes.TrackPageView]);
	} else {
		var serviceHelper = require('*/cartridge/scripts/helpers/ServiceHelper');
		var contactInfo = serviceHelper.GetContactInfoFromSession('', true);
		if (contactInfo) {
			var email = 'Email' in contactInfo && contactInfo.Email ? contactInfo.Email : '';
			var id = 'id' in contactInfo && contactInfo.id ? contactInfo.id : '';
			var uniqueId = !empty(id) ? id : email;
			collectInfos.push([EventTypes.SetUserInfo, {
				"email": uniqueId
			}]);
		}
	}
}

module.exports = exports;
