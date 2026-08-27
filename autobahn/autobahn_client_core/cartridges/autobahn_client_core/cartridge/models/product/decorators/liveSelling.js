'use strict';

var Site = require('dw/system/Site');
var liveSellingCategoryHelper = require('*/cartridge/scripts/helpers/liveSellingCategoryHelper');
var badgesDecorator = require('*/cartridge/models/product/decorators/badges');

var LIVE_SELLING_BADGE_NAME = 'live-selling';

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

// liveSellingEventID/BadgeText/HostName/EventSummary are static for the current event, so they live as Site Preferences, not per-product custom attributes.
function getSitePreferenceValue(prefID) {
    try {
        var value = Site.getCurrent().getCustomPreferenceValue(prefID);
        return empty(value) ? '' : value.toString();
    } catch (e) {
        return '';
    }
}

module.exports = function liveSelling(object, apiProduct) {
    var isLiveSellingProduct = getCustomBoolean(apiProduct.custom, 'isLiveSellingProduct') || liveSellingCategoryHelper.isProductAssignedToLiveSellingCategory(apiProduct);
    // Sourced from the 'badges' Custom Object (id: live-selling) in a single lookup, so the business can control its look - and turn it on/off via its date window - from Business Manager. Only falls back to the old Site Preference text if that object was never created at all; if it exists but is outside its date window, the badge genuinely stays hidden.
    var liveSellingBadgeStatus = badgesDecorator.resolveBadgeStatus(LIVE_SELLING_BADGE_NAME);
    var liveSellingBadge = liveSellingBadgeStatus.badge;
    var badgeText = liveSellingBadge ? liveSellingBadge.name : (liveSellingBadgeStatus.exists ? '' : (getSitePreferenceValue('liveSellingBadgeText') || 'LIVE'));

    define(object, 'isLiveSellingProduct', isLiveSellingProduct);
    define(object, 'liveSellingItemID', getCustomValue(apiProduct.custom, 'liveSellingItemID') || apiProduct.ID);
    define(object, 'liveSellingEventID', getSitePreferenceValue('liveSellingEventID'));
    define(object, 'liveSellingBadgeText', badgeText);
    define(object, 'liveSellingBadgeClass', liveSellingBadge ? liveSellingBadge.class : '');
    define(object, 'liveSellingBadgeStyle', liveSellingBadge && liveSellingBadge.style ? liveSellingBadge.style : '');
    define(object, 'liveSellingHostName', getSitePreferenceValue('liveSellingHostName'));
    define(object, 'liveSellingEventSummary', getSitePreferenceValue('liveSellingEventSummary'));
};
