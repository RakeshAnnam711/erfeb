'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var LineItemCtnr = require('dw/order/LineItemCtnr');
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');

var SESSION_KEY = 'agentLockedLineItemUUIDs';
var SESSION_BASKET_KEY = 'agentLockedBasketUUID';
var SESSION_STOREFRONT_KEY = 'storefrontLineItemUUIDs';
var SESSION_STOREFRONT_BASKET_KEY = 'storefrontLineItemBasketUUID';
var CSC_LINE_ITEM_ATTR = 'isCSCHandoffLineItem';
var STOREFRONT_LINE_ITEM_ATTR = 'isStorefrontLineItem';
var DEFAULT_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes, used only if the site preference is unset/invalid
var liveSellingCategoryHelper = require('*/cartridge/scripts/helpers/liveSellingCategoryHelper');

// Configurable via the cscHandoffExpirationHours Site Preference; falls back to the 5-minute default if unset.
function getExpirationMs() {
    try {
        var hours = Site.getCurrent().getCustomPreferenceValue('cscHandoffExpirationHours');

        if (hours === null || hours === undefined || isNaN(hours) || hours <= 0) {
            return DEFAULT_EXPIRATION_MS;
        }

        return hours * 60 * 60 * 1000;
    } catch (e) {
        return DEFAULT_EXPIRATION_MS;
    }
}

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

// This org's Business Manager CSC "New Order for Customer" flow never sets isAgentBasket() true - it tags the basket with channelType instead.
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
        return !!lineItem.custom[attributeID];
    } catch (e) {
        return false;
    }
}

function setCustomBoolean(lineItem, attributeID, value) {
    try {
        lineItem.custom[attributeID] = value;
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

// Used right after a storefront AddProduct - Add to Cart is hidden for CSC/live-selling products, so any CSC flag found here is a false positive from the sweep and safe to clear.
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

function getCustomBooleanTriState(object, attributeID) {
    try {
        if (!object || !object.custom || !(attributeID in object.custom)) {
            return undefined;
        }

        var value = object.custom[attributeID];

        if (value === null || value === undefined) {
            return undefined;
        }

        return !!value;
    } catch (e) {
        return undefined;
    }
}

function isLiveSellingProduct(product) {
    if (!product) {
        return false;
    }

    if (getCustomBoolean(product, 'isLiveSellingProduct')) {
        return true;
    }

    return liveSellingCategoryHelper.isProductAssignedToLiveSellingCategory(product);
}

// Mirrors doPrePlaceOrder.js's tri-state resolution: the agent's explicit checkbox choice wins when present, otherwise falls back to the catalog product's own live selling flag.
function isLineItemLiveSelling(lineItem) {
    try {
        var agentChoice = getCustomBooleanTriState(lineItem, 'isLiveSellingLineItem');

        if (agentChoice !== undefined) {
            return agentChoice;
        }

        return isLiveSellingProduct(lineItem.product);
    } catch (e) {
        return false;
    }
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

    // Release any line item no longer correctly locked - confirmed storefront, or CSC but no longer live selling (agent unchecked the box) - so the session-cached list can't just grow forever.
    if (basket && basket.allProductLineItems) {
        Transaction.wrap(function () {
            collections.forEach(basket.allProductLineItems, function (lineItem) {
                var isKnownStorefrontItem = isStorefrontLineItem(lineItem) || storedStorefrontUUIDs.indexOf(lineItem.UUID) > -1;
                var shouldRelease = isKnownStorefrontItem || (isCSCHandoffLineItem(lineItem) && !isLineItemLiveSelling(lineItem));

                if (shouldRelease) {
                    if (isCSCHandoffLineItem(lineItem)) {
                        setCustomBoolean(lineItem, CSC_LINE_ITEM_ATTR, false);
                    }

                    lockedUUIDs = lockedUUIDs.filter(function (uuid) {
                        return uuid !== lineItem.UUID;
                    });
                }
            });
        });
    }

    // Sweeps any unclassified item into CSC on every render (stays "always on" so a later CSC add still gets locked); safe against customer-added items since AddProduct always corrects those via forceMarkStorefrontLineItem first.
    shouldMarkUnclassifiedAsCSC = forceCurrentItemsLocked || isAgentBasket(basket) || isCustomerServiceCenterBasket(basket);

    if (basket && basket.allProductLineItems && shouldMarkUnclassifiedAsCSC) {
        Transaction.wrap(function () {
            collections.forEach(basket.allProductLineItems, function (lineItem) {
                var isKnownStorefrontItem = isStorefrontLineItem(lineItem) || storedStorefrontUUIDs.indexOf(lineItem.UUID) > -1;

                if (!isKnownStorefrontItem && !isCSCHandoffLineItem(lineItem) && isLineItemLiveSelling(lineItem)) {
                    markCSCHandoffLineItem(lineItem);
                    addUnique(lockedUUIDs, lineItem.UUID);
                }
            });
        });
    }

    // Pricing sync is centralized in the dw.order.calculate hook (calculate.js), not here.

    if (lockedUUIDs.length) {
        setLockedUUIDs(basket, lockedUUIDs);
    } else {
        clearLockedUUIDs();
    }

    // Drives a Dynamic Customer Group used to restrict a shipping method to baskets with a live selling item - explicitly set false so it can't stick around true after the item is removed.
    if (typeof session !== 'undefined' && session.custom) {
        session.custom.hasLiveSellingItemInCart = lockedUUIDs.length > 0;
    }

    return lockedUUIDs;
}

// Removes CSC handoff line items sitting unpurchased longer than cscHandoffExpirationHours; clock starts at each item's own creationDate. Returns the removed UUIDs so the caller can patch stale view data.
function removeExpiredCSCLineItems(basket) {
    if (!basket || !basket.allProductLineItems) {
        return [];
    }

    try {
        var now = new Date().getTime();
        var expirationMs = getExpirationMs();
        var expiredItems = basket.allProductLineItems.toArray().filter(function (lineItem) {
            return isCSCHandoffLineItem(lineItem) && lineItem.creationDate && (now - lineItem.creationDate.getTime()) >= expirationMs;
        });
        var removedUUIDs = expiredItems.map(function (lineItem) { return lineItem.UUID; });

        Transaction.wrap(function () {
            expiredItems.forEach(function (lineItem) { basket.removeProductLineItem(lineItem); });
        });

        return removedUUIDs;
    } catch (e) {
        return [];
    }
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

    // Unlike isAgentLockedLineItem above (session-sweep based), this reads persisted state directly, so it stays correct on order confirmation/history pages too.
    if (productLineItem && sourceLineItem) {
        productLineItem.isLiveSellingLineItem = isLineItemLiveSelling(sourceLineItem); // eslint-disable-line no-param-reassign
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
    isLineItemLiveSelling: isLineItemLiveSelling,
    isLockedUUID: isLockedUUID,
    isRestrictedBasket: isRestrictedBasket,
    isAgentBasket: isAgentBasket,
    forceMarkStorefrontLineItem: forceMarkStorefrontLineItem,
    removeExpiredCSCLineItems: removeExpiredCSCLineItems
};
