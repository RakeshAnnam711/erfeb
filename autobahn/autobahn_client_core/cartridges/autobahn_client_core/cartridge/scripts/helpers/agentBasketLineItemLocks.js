'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var LineItemCtnr = require('dw/order/LineItemCtnr');
var Transaction = require('dw/system/Transaction');

var SESSION_KEY = 'agentLockedLineItemUUIDs';
var SESSION_BASKET_KEY = 'agentLockedBasketUUID';
var SESSION_STOREFRONT_KEY = 'storefrontLineItemUUIDs';
var SESSION_STOREFRONT_BASKET_KEY = 'storefrontLineItemBasketUUID';
var CSC_LINE_ITEM_ATTR = 'isCSCHandoffLineItem';
var STOREFRONT_LINE_ITEM_ATTR = 'isStorefrontLineItem';

function getBasketUUID(basket) {
    try {
        return basket && (basket.UUID || (typeof basket.getUUID === 'function' && basket.getUUID()));
    } catch (e) {
        return null;
    }
}

function isAgentBasket(basket) {
    if (!basket) {
        return false;
    }

    try {
        return typeof basket.isAgentBasket === 'function' && basket.isAgentBasket();
    } catch (e) {
        return false;
    }
}

// This org's Business Manager "Customer Service Center" ("New Order for Customer") flow does not
// create baskets via BasketMgr.createAgentBasket() (isAgentBasket() is always false for them). It
// tags the basket with the platform-managed channelType instead, confirmed safe to read here.
function isCustomerServiceCenterBasket(basket) {
    if (!basket) {
        return false;
    }

    try {
        var channelType = basket.channelType;
        return channelType != null && channelType == LineItemCtnr.CHANNEL_TYPE_CUSTOMERSERVICECENTER;
    } catch (e) {
        return false;
    }
}

function getCustomBoolean(lineItem, attributeID) {
    try {
        return !!(lineItem && lineItem.custom && lineItem.custom[attributeID]);
    } catch (e) {
        return false;
    }
}

function setCustomBoolean(lineItem, attributeID, value) {
    try {
        if (lineItem && lineItem.custom) {
            lineItem.custom[attributeID] = value;
        }
    } catch (e) {
        // Metadata may not be imported yet; session state still protects this request.
    }
}

function addUnique(list, value) {
    if (value && list.indexOf(value) === -1) {
        list.push(value);
    }
}

function getStoredLockedUUIDs(basket) {
    var basketUUID = getBasketUUID(basket);

    if (!basketUUID || typeof session === 'undefined' || !session.custom || session.custom[SESSION_BASKET_KEY] !== basketUUID || !session.custom[SESSION_KEY]) {
        return [];
    }

    try {
        return JSON.parse(session.custom[SESSION_KEY]) || [];
    } catch (e) {
        return [];
    }
}

function setLockedUUIDs(basket, lockedUUIDs) {
    var basketUUID = getBasketUUID(basket);

    if (basketUUID && typeof session !== 'undefined' && session.custom) {
        session.custom[SESSION_BASKET_KEY] = basketUUID;
        session.custom[SESSION_KEY] = JSON.stringify(lockedUUIDs || []);
    }
}

function clearLockedUUIDs() {
    if (typeof session !== 'undefined' && session.custom) {
        session.custom[SESSION_BASKET_KEY] = null;
        session.custom[SESSION_KEY] = null;
    }
}

function getStoredStorefrontUUIDs(basket) {
    var basketUUID = getBasketUUID(basket);

    if (!basketUUID || typeof session === 'undefined' || !session.custom || session.custom[SESSION_STOREFRONT_BASKET_KEY] !== basketUUID || !session.custom[SESSION_STOREFRONT_KEY]) {
        return [];
    }

    try {
        return JSON.parse(session.custom[SESSION_STOREFRONT_KEY]) || [];
    } catch (e) {
        return [];
    }
}

function setStoredStorefrontUUIDs(basket, storefrontUUIDs) {
    var basketUUID = getBasketUUID(basket);

    if (basketUUID && typeof session !== 'undefined' && session.custom) {
        session.custom[SESSION_STOREFRONT_BASKET_KEY] = basketUUID;
        session.custom[SESSION_STOREFRONT_KEY] = JSON.stringify(storefrontUUIDs || []);
    }
}

function getLineItemContainer(lineItem) {
    try {
        return lineItem && (lineItem.lineItemCtnr || (typeof lineItem.getLineItemCtnr === 'function' && lineItem.getLineItemCtnr()));
    } catch (e) {
        return null;
    }
}

function isCSCHandoffLineItem(lineItem) {
    return getCustomBoolean(lineItem, CSC_LINE_ITEM_ATTR);
}

function isStorefrontLineItem(lineItem) {
    return getCustomBoolean(lineItem, STOREFRONT_LINE_ITEM_ATTR);
}

function markCSCHandoffLineItem(lineItem) {
    setCustomBoolean(lineItem, CSC_LINE_ITEM_ATTR, true);
}

function markCurrentLineItemsAsCSCHandoff(basket) {
    if (!basket || !basket.allProductLineItems) {
        return;
    }

    collections.forEach(basket.allProductLineItems, function (lineItem) {
        markCSCHandoffLineItem(lineItem);
    });
}

function markStorefrontLineItem(lineItem) {
    var basket;
    var storefrontUUIDs;

    if (!isCSCHandoffLineItem(lineItem)) {
        setCustomBoolean(lineItem, STOREFRONT_LINE_ITEM_ATTR, true);

        basket = getLineItemContainer(lineItem);
        storefrontUUIDs = getStoredStorefrontUUIDs(basket);
        addUnique(storefrontUUIDs, lineItem.UUID);
        setStoredStorefrontUUIDs(basket, storefrontUUIDs);
    }
}

// Unlike markStorefrontLineItem, this does not check isCSCHandoffLineItem first. It is used right after
// a storefront AddProduct call, where the caller has just matched this exact line item by productID for
// the current request. Because Add to Cart is hidden on PLP/PDP for CSC/live-selling products, a genuine
// storefront click can never target an existing CSC line item's product - so any CSC flag found here must
// be a false positive from the classification sweep running earlier in the same request (during the base
// AddProduct response/model build, before this correction runs) and is safe to clear.
function forceMarkStorefrontLineItem(lineItem) {
    var basket;
    var storefrontUUIDs;

    setCustomBoolean(lineItem, CSC_LINE_ITEM_ATTR, false);
    setCustomBoolean(lineItem, STOREFRONT_LINE_ITEM_ATTR, true);

    basket = getLineItemContainer(lineItem);
    storefrontUUIDs = getStoredStorefrontUUIDs(basket);
    addUnique(storefrontUUIDs, lineItem.UUID);
    setStoredStorefrontUUIDs(basket, storefrontUUIDs);
}

function getPersistedLockedUUIDs(basket) {
    var lockedUUIDs = [];

    if (!basket || !basket.allProductLineItems) {
        return lockedUUIDs;
    }

    collections.forEach(basket.allProductLineItems, function (lineItem) {
        if (isCSCHandoffLineItem(lineItem)) {
            addUnique(lockedUUIDs, lineItem.UUID);
        }
    });

    return lockedUUIDs;
}

function hasStorefrontLineItems(basket) {
    var found = false;
    var storedStorefrontUUIDs = getStoredStorefrontUUIDs(basket);

    if (!basket || !basket.allProductLineItems) {
        return false;
    }

    collections.forEach(basket.allProductLineItems, function (lineItem) {
        if (isStorefrontLineItem(lineItem) || storedStorefrontUUIDs.indexOf(lineItem.UUID) > -1) {
            found = true;
        }
    });

    return found;
}

function ensureLockedLineItems(basket, forceCurrentItemsLocked) {
    var lockedUUIDs = getStoredLockedUUIDs(basket);
    var persistedLockedUUIDs = getPersistedLockedUUIDs(basket);
    var currentUUIDs = [];
    var storedStorefrontUUIDs;
    var hasStorefrontItems;
    var shouldMarkUnclassifiedAsCSC;

    if (basket && basket.allProductLineItems) {
        collections.forEach(basket.allProductLineItems, function (lineItem) {
            addUnique(currentUUIDs, lineItem.UUID);
        });
        lockedUUIDs = lockedUUIDs.filter(function (uuid) {
            return currentUUIDs.indexOf(uuid) > -1;
        });
    }

    persistedLockedUUIDs.forEach(function (uuid) {
        addUnique(lockedUUIDs, uuid);
    });

    storedStorefrontUUIDs = getStoredStorefrontUUIDs(basket);
    hasStorefrontItems = hasStorefrontLineItems(basket);
    // Sweep any unclassified line item into CSC on every render while this basket is CSC-sourced. This
    // must stay "always on" (not one-time) so a live-selling item pushed from CSC *after* the customer has
    // already been shopping still gets locked. It is safe against re-claiming customer-added items because
    // Cart.js's AddProduct handler now unconditionally corrects a new item's classification via
    // forceMarkStorefrontLineItem right after this sweep may have run during the same request's response
    // build - so any storefront addition is self-healing rather than depending on sweep ordering.
    shouldMarkUnclassifiedAsCSC = forceCurrentItemsLocked || isAgentBasket(basket) || isCustomerServiceCenterBasket(basket);

    if (basket && basket.allProductLineItems && shouldMarkUnclassifiedAsCSC) {
        Transaction.wrap(function () {
            collections.forEach(basket.allProductLineItems, function (lineItem) {
                var isKnownStorefrontItem = isStorefrontLineItem(lineItem) || storedStorefrontUUIDs.indexOf(lineItem.UUID) > -1;

                if (!isKnownStorefrontItem && !isCSCHandoffLineItem(lineItem)) {
                    markCSCHandoffLineItem(lineItem);
                    addUnique(lockedUUIDs, lineItem.UUID);
                }
            });
        });
    }

    if (lockedUUIDs.length) {
        setLockedUUIDs(basket, lockedUUIDs);
    } else {
        clearLockedUUIDs();
    }

    return lockedUUIDs;
}

function isRestrictedBasket(basket) {
    return ensureLockedLineItems(basket).length > 0;
}

function isLockedUUID(basket, uuid) {
    return !!uuid && ensureLockedLineItems(basket).indexOf(uuid) > -1;
}

function decorateProductLineItem(productLineItem, sourceLineItem) {
    if (productLineItem && sourceLineItem && isLockedUUID(sourceLineItem.lineItemCtnr, sourceLineItem.UUID)) {
        productLineItem.isAgentLockedLineItem = true; // eslint-disable-line no-param-reassign
    }
}

function decorateCartModelItems(items, basket) {
    var lockedUUIDs = ensureLockedLineItems(basket);

    if (!items || !items.length || !lockedUUIDs.length) {
        return;
    }

    items.forEach(function (item) {
        if (item && lockedUUIDs.indexOf(item.UUID) > -1) {
            item.isAgentLockedLineItem = true; // eslint-disable-line no-param-reassign
        }
    });
}

module.exports = {
    clearLockedUUIDs: clearLockedUUIDs,
    decorateCartModelItems: decorateCartModelItems,
    decorateProductLineItem: decorateProductLineItem,
    ensureLockedLineItems: ensureLockedLineItems,
    isCSCHandoffLineItem: isCSCHandoffLineItem,
    isCustomerServiceCenterBasket: isCustomerServiceCenterBasket,
    isLockedUUID: isLockedUUID,
    isRestrictedBasket: isRestrictedBasket,
    isAgentBasket: isAgentBasket,
    forceMarkStorefrontLineItem: forceMarkStorefrontLineItem,
    markCurrentLineItemsAsCSCHandoff: markCurrentLineItemsAsCSCHandoff,
    markStorefrontLineItem: markStorefrontLineItem
};
