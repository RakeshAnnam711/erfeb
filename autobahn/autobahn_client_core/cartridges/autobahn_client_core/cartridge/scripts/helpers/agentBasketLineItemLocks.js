'use strict';

var collections = require('*/cartridge/scripts/util/collections');

var CHANNEL_TYPE_CUSTOMERSERVICECENTER = 11;
var SESSION_KEY = 'agentLockedLineItemUUIDs';
var SESSION_BASKET_KEY = 'agentLockedBasketUUID';
var SESSION_AWAITING_HANDOFF_KEY = 'agentBasketClearedAwaitingHandoff';
var CSC_LINE_ITEM_ATTR = 'isCSCHandoffLineItem';
var LIVE_SHOPPING_LINE_ITEM_ATTR = 'isLiveShoppingLineItem';
var BAMBUSER_LINE_ITEM_ATTR = 'isbambuserproduct';

function getEnumValue(enumValue) {
    if (!enumValue) {
        return null;
    }

    try {
        if (typeof enumValue.value !== 'undefined') {
            return enumValue.value;
        }
    } catch (e) {
        // Fall back to the getter below.
    }

    try {
        if (typeof enumValue.getValue === 'function') {
            return enumValue.getValue();
        }
    } catch (e) {
        return null;
    }

    return null;
}

function getBasketUUID(basket) {
    if (!basket) {
        return null;
    }

    try {
        return basket.UUID || (typeof basket.getUUID === 'function' && basket.getUUID());
    } catch (e) {
        return null;
    }
}

function isCustomerServiceCenterBasket(basket) {
    var channelType = null;

    try {
        channelType = basket.channelType;
    } catch (e) {
        // Fall back to the getter below.
    }

    try {
        channelType = channelType || (typeof basket.getChannelType === 'function' && basket.getChannelType());
    } catch (e) {
        return false;
    }

    return getEnumValue(channelType) === CHANNEL_TYPE_CUSTOMERSERVICECENTER;
}

function isAgentBasket(basket) {
    if (!basket) {
        return false;
    }

    try {
        if (typeof basket.isAgentBasket === 'function' && basket.isAgentBasket()) {
            return true;
        }
    } catch (e) {
        // Fall back to the Script API property below.
    }

    try {
        if (basket.agentBasket === true) {
            return true;
        }
    } catch (e) {
        return isCustomerServiceCenterBasket(basket);
    }

    return isCustomerServiceCenterBasket(basket);
}

function getStoredLockedUUIDs(basket) {
    var basketUUID = getBasketUUID(basket);

    if (!basketUUID || typeof session === 'undefined' || !session.custom || session.custom[SESSION_BASKET_KEY] !== basketUUID || !session.custom[SESSION_KEY]) {
        return [];
    }

    try {
        return session.custom[SESSION_KEY] ? JSON.parse(session.custom[SESSION_KEY]) : [];
    } catch (e) {
        return [];
    }
}

function hasStoredLockState(basket) {
    var basketUUID = getBasketUUID(basket);

    return !!basketUUID && typeof session !== 'undefined' && !!session.custom && session.custom[SESSION_BASKET_KEY] === basketUUID && !!session.custom[SESSION_KEY];
}

function setLockedUUIDs(basket, lockedUUIDs) {
    var basketUUID = getBasketUUID(basket);

    if (!basketUUID) {
        return;
    }

    if (typeof session !== 'undefined' && session.custom) {
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

function isAwaitingHandoffAfterClear() {
    return typeof session !== 'undefined' && session.custom && session.custom[SESSION_AWAITING_HANDOFF_KEY] === true;
}

function setAwaitingHandoffAfterClear() {
    if (typeof session !== 'undefined' && session.custom) {
        session.custom[SESSION_AWAITING_HANDOFF_KEY] = true;
    }
}

function clearAwaitingHandoffAfterClear() {
    if (typeof session !== 'undefined' && session.custom) {
        session.custom[SESSION_AWAITING_HANDOFF_KEY] = null;
    }
}

function addUnique(uuidList, uuid) {
    if (uuid && uuidList.indexOf(uuid) === -1) {
        uuidList.push(uuid);
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
            return true;
        }
    } catch (e) {
        // The metadata may not be imported yet. The session lock still protects the basket.
    }

    return false;
}

function isCSCHandoffLineItem(lineItem) {
    return getCustomBoolean(lineItem, CSC_LINE_ITEM_ATTR);
}

function isLiveShoppingLineItem(lineItem) {
    return getCustomBoolean(lineItem, LIVE_SHOPPING_LINE_ITEM_ATTR) || getCustomBoolean(lineItem, BAMBUSER_LINE_ITEM_ATTR);
}

function markCSCHandoffLineItem(lineItem) {
    setCustomBoolean(lineItem, CSC_LINE_ITEM_ATTR, true);
}

function markLiveShoppingLineItem(lineItem) {
    setCustomBoolean(lineItem, LIVE_SHOPPING_LINE_ITEM_ATTR, true);
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

function markCurrentLineItemsAsCSCHandoff(basket) {
    if (!basket || !basket.allProductLineItems) {
        return;
    }

    collections.forEach(basket.allProductLineItems, function (lineItem) {
        markCSCHandoffLineItem(lineItem);
    });
}

function hasProductLineItems(basket) {
    try {
        return !!(basket && basket.allProductLineItems && !basket.allProductLineItems.empty);
    } catch (e) {
        return false;
    }
}

function ensureLockedLineItems(basket, forceCurrentItemsLocked) {
    var lockedUUIDs = getStoredLockedUUIDs(basket);
    var persistedLockedUUIDs = getPersistedLockedUUIDs(basket);

    persistedLockedUUIDs.forEach(function (uuid) {
        addUnique(lockedUUIDs, uuid);
    });

    if (basket && basket.allProductLineItems && hasProductLineItems(basket) && (forceCurrentItemsLocked || (isAwaitingHandoffAfterClear() && !lockedUUIDs.length) || (isAgentBasket(basket) && !hasStoredLockState(basket) && !lockedUUIDs.length))) {
        lockedUUIDs = [];

        collections.forEach(basket.allProductLineItems, function (lineItem) {
            markCSCHandoffLineItem(lineItem);
            addUnique(lockedUUIDs, lineItem.UUID);
        });

        setLockedUUIDs(basket, lockedUUIDs);
        clearAwaitingHandoffAfterClear();
        return lockedUUIDs;
    }

    if (lockedUUIDs.length) {
        setLockedUUIDs(basket, lockedUUIDs);
    }

    return lockedUUIDs;
}

function isRestrictedBasket(basket) {
    return isAgentBasket(basket) || hasStoredLockState(basket) || getPersistedLockedUUIDs(basket).length > 0;
}

function isLockedUUID(basket, uuid) {
    return !!uuid && ensureLockedLineItems(basket).indexOf(uuid) > -1;
}

function decorateItems(items, basket) {
    var lockedUUIDs = ensureLockedLineItems(basket);

    if (!items || !items.length || !lockedUUIDs.length) {
        return;
    }

    items.forEach(function (item) {
        if (lockedUUIDs.indexOf(item.UUID) > -1) {
            item.isAgentLockedLineItem = true; // eslint-disable-line no-param-reassign
        }
    });
}

function decorateShippingModels(shippingModels, basket) {
    if (!shippingModels || !shippingModels.length) {
        return;
    }

    shippingModels.forEach(function (shippingModel) {
        if (shippingModel.productLineItems) {
            decorateItems(shippingModel.productLineItems.items, basket);
        }
    });
}

module.exports = {
    clearLockedUUIDs: clearLockedUUIDs,
    clearAwaitingHandoffAfterClear: clearAwaitingHandoffAfterClear,
    decorateItems: decorateItems,
    decorateShippingModels: decorateShippingModels,
    ensureLockedLineItems: ensureLockedLineItems,
    isAgentBasket: isAgentBasket,
    isCSCHandoffLineItem: isCSCHandoffLineItem,
    isLiveShoppingLineItem: isLiveShoppingLineItem,
    isLockedUUID: isLockedUUID,
    isRestrictedBasket: isRestrictedBasket,
    markCSCHandoffLineItem: markCSCHandoffLineItem,
    markCurrentLineItemsAsCSCHandoff: markCurrentLineItemsAsCSCHandoff,
    markLiveShoppingLineItem: markLiveShoppingLineItem,
    setAwaitingHandoffAfterClear: setAwaitingHandoffAfterClear
};
