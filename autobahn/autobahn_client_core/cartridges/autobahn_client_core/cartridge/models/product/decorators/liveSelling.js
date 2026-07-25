'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Site = require('dw/system/Site');

var LIVE_CATEGORY_IDS = ['live-selling-dev-products'];

function define(object, name, value) {
    try {
        Object.defineProperty(object, name, {
            configurable: true,
            enumerable: true,
            value: value
        });
    } catch (e) {
        object[name] = value; // eslint-disable-line no-param-reassign
    }
}

function getCustomValue(customAttributes, attributeID) {
    var value;

    try {
        if (!customAttributes || !(attributeID in customAttributes)) {
            return '';
        }

        value = customAttributes[attributeID];

        if (empty(value)) {
            return '';
        }

        return value.toString();
    } catch (e) {
        return '';
    }
}

function getCustomBoolean(customAttributes, attributeID) {
    try {
        return !!(customAttributes && attributeID in customAttributes && customAttributes[attributeID]);
    } catch (e) {
        return false;
    }
}

// liveSellingEventID/BadgeText/HostName/EventDate are static, shared across every live selling product for
// the current event, so they live as Site Preferences rather than per-product custom attributes.
function getSitePreferenceValue(prefID) {
    try {
        var value = Site.getCurrent().getCustomPreferenceValue(prefID);
        return empty(value) ? '' : value.toString();
    } catch (e) {
        return '';
    }
}

function isLiveCategory(category) {
    var categoryID;

    if (!category) {
        return false;
    }

    try {
        categoryID = category.ID || (typeof category.getID === 'function' && category.getID());

        if (LIVE_CATEGORY_IDS.indexOf(categoryID) > -1) {
            return true;
        }

        return getCustomBoolean(category.custom, 'isLiveSellingCategory');
    } catch (e) {
        return false;
    }
}

function isAssignedToLiveCategory(apiProduct) {
    var foundLiveCategory = false;

    try {
        if (isLiveCategory(apiProduct.primaryCategory)) {
            return true;
        }

        if (apiProduct.categories) {
            collections.forEach(apiProduct.categories, function (category) {
                if (isLiveCategory(category)) {
                    foundLiveCategory = true;
                }
            });
        }
    } catch (e) {
        return false;
    }

    return foundLiveCategory;
}

module.exports = function liveSelling(object, apiProduct) {
    var isLiveSellingProduct = getCustomBoolean(apiProduct.custom, 'isLiveSellingProduct') || isAssignedToLiveCategory(apiProduct);
    var badgeText = getSitePreferenceValue('liveSellingBadgeText') || 'LIVE';

    define(object, 'isLiveSellingProduct', isLiveSellingProduct);
    define(object, 'liveSellingItemID', getCustomValue(apiProduct.custom, 'liveSellingItemID') || apiProduct.ID);
    define(object, 'liveSellingEventID', getSitePreferenceValue('liveSellingEventID'));
    define(object, 'liveSellingBadgeText', badgeText);
    define(object, 'liveSellingHostName', getSitePreferenceValue('liveSellingHostName'));
    define(object, 'liveSellingEventDate', getSitePreferenceValue('liveSellingEventDate'));
};
