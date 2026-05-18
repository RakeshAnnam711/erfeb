'use strict';

var collections = require('*/cartridge/scripts/util/collections');

var CHANNEL_TYPE_CUSTOMERSERVICECENTER = 11;
var SESSION_KEY = 'agentLockedLineItemUUIDs';
var SESSION_BASKET_KEY = 'agentLockedBasketUUID';

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

    if (!basketUUID || session.custom[SESSION_BASKET_KEY] !== basketUUID || !session.custom[SESSION_KEY]) {
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

    return !!basketUUID && session.custom[SESSION_BASKET_KEY] === basketUUID && !!session.custom[SESSION_KEY];
}

function setLockedUUIDs(basket, lockedUUIDs) {
    var basketUUID = getBasketUUID(basket);

    if (!basketUUID) {
        return;
    }

    session.custom[SESSION_BASKET_KEY] = basketUUID;
    session.custom[SESSION_KEY] = JSON.stringify(lockedUUIDs || []);
}

function clearLockedUUIDs() {
    session.custom[SESSION_BASKET_KEY] = null;
    session.custom[SESSION_KEY] = null;
}

function ensureLockedLineItems(basket) {
    var lockedUUIDs = getStoredLockedUUIDs(basket);

    if (hasStoredLockState(basket) || !isAgentBasket(basket)) {
        return lockedUUIDs;
    }

    lockedUUIDs = [];
    collections.forEach(basket.allProductLineItems, function (lineItem) {
        lockedUUIDs.push(lineItem.UUID);
    });

    setLockedUUIDs(basket, lockedUUIDs);
    return lockedUUIDs;
}

function isRestrictedBasket(basket) {
    return isAgentBasket(basket) || hasStoredLockState(basket);
}

function isLockedUUID(basket, uuid) {
    return !!uuid && getStoredLockedUUIDs(basket).indexOf(uuid) > -1;
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
    decorateItems: decorateItems,
    decorateShippingModels: decorateShippingModels,
    ensureLockedLineItems: ensureLockedLineItems,
    isAgentBasket: isAgentBasket,
    isLockedUUID: isLockedUUID,
    isRestrictedBasket: isRestrictedBasket
};
