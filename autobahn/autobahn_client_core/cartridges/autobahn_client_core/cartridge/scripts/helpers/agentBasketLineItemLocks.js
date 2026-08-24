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

// Business-configurable via the cscHandoffExpirationHours Site Preference, so the business can change the
// expiration window without a code deploy. Falls back to the original 5-minute default if left blank.
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

// Does not check isCSCHandoffLineItem first (unlike the sweep logic elsewhere in this file). It is used right after
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

// Mirrors the tri-state resolution used in doPrePlaceOrder.js at checkout, so cart locking and order-level
// live selling reporting always agree: the CSC agent's explicit checkbox choice (checked or unchecked) on
// this line item wins when present, otherwise fall back to the catalog product's own live selling flag.
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

    // Release any line item that is no longer correctly locked: either it's confirmed storefront, or it
    // was previously locked as CSC but is no longer live selling (the CSC agent unchecked "Is Live Selling
    // Line Item" after initially checking it, or otherwise changed their mind). Without this, a line item's
    // isCSCHandoffLineItem flag only ever gets set by the sweep below and never re-evaluated once true, so
    // it would stay locked forever even after the agent explicitly marks it not-live-selling. This also
    // covers the session-cache staleness case: a line item the sweep briefly (and wrongly) locked earlier
    // in the same request - before AddProduct's forceMarkStorefrontLineItem corrected it - stays purged
    // here instead of persisting forever, since the session-cached UUID list otherwise only ever grows.
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

    // Sweep any unclassified line item into CSC on every render while this basket is CSC-sourced. This
    // must stay "always on" (not one-time) so a live-selling item pushed from CSC *after* the customer has
    // already been shopping still gets locked. It is safe against re-claiming customer-added items because
    // Cart.js's AddProduct handler now unconditionally corrects a new item's classification via
    // forceMarkStorefrontLineItem, and the purge above keeps the session cache in sync with that correction.
    // Only live selling items get locked - a CSC agent adding a plain, non-live-selling product should
    // leave that item fully editable for the customer, same as if they'd added it themselves.
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

    // Pricing is no longer synchronized here - it's centralized in the dw.order.calculate hook override
    // (cartridge/scripts/hooks/cart/calculate.js), which runs on every basket recalculation regardless of
    // which page/controller triggers it, not just the specific storefront pages that call this sweep.

    if (lockedUUIDs.length) {
        setLockedUUIDs(basket, lockedUUIDs);
    } else {
        clearLockedUUIDs();
    }

    // Drives a Dynamic Customer Group (session.custom rule condition in Business Manager) used to restrict
    // a shipping method to baskets with a live selling item. lockedUUIDs is already filtered down to only
    // UUIDs still present on this basket, so this can't go stale from a previous basket in the same session.
    // Explicitly set to false (not just left unset) so it can't stick around true after the item is removed.
    if (typeof session !== 'undefined' && session.custom) {
        session.custom.hasLiveSellingItemInCart = lockedUUIDs.length > 0;
    }

    return lockedUUIDs;
}

// Removes CSC handoff line items that have sat in the basket, unpurchased, longer than the
// cscHandoffExpirationHours Site Preference. Clock starts at the line item's own creationDate (when the
// CSC agent added it), not the customer's session activity. Each line item is evaluated independently, so
// e.g. two CSC items added at different times each expire on their own schedule. Returns the UUIDs of
// whatever got removed (empty array if nothing expired), so the caller can both recalculate basket totals
// and patch any view data it already built from the pre-removal basket state instead of rendering a
// now-stale line item.
function removeExpiredCSCLineItems(basket) {
    var expiredItems = [];
    var now = new Date().getTime();
    var expirationMs = getExpirationMs();

    if (!basket || !basket.allProductLineItems) {
        return [];
    }

    collections.forEach(basket.allProductLineItems, function (lineItem) {
        try {
            if (isCSCHandoffLineItem(lineItem) && lineItem.creationDate && (now - lineItem.creationDate.getTime()) >= expirationMs) {
                expiredItems.push(lineItem);
            }
        } catch (e) {
            // Skip this line item on any unexpected read failure rather than blocking the whole check.
        }
    });

    if (!expiredItems.length) {
        return [];
    }

    var removedUUIDs = expiredItems.map(function (lineItem) {
        return lineItem.UUID;
    });

    Transaction.wrap(function () {
        expiredItems.forEach(function (lineItem) {
            basket.removeProductLineItem(lineItem);
        });
    });

    return removedUUIDs;
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

    // Unlike isAgentLockedLineItem above (session/basket-sweep based, unreliable once the basket becomes an
    // order), this reads the persisted line item state directly, so it stays correct on order confirmation/
    // history pages too.
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
