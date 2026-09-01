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
        return !!customAttributes[attributeID];
    } catch (e) {
        return false;
    }
}

// liveSellingHostName/EventSummary are static for the current event, so they live as Site Preferences, not per-product custom attributes.
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
    // Sourced entirely from the 'badges' Custom Object (id: live-selling), so the business can control its look - and turn it on/off via its date window - from Business Manager. No fallback text - if the object doesn't exist or is outside its date window, no badge shows.
    var liveSellingBadge = badgesDecorator.resolveBadge(LIVE_SELLING_BADGE_NAME);
    var badgeText = liveSellingBadge ? liveSellingBadge.name : '';

    define(object, 'isLiveSellingProduct', isLiveSellingProduct);
    define(object, 'liveSellingItemID', getCustomValue(apiProduct.custom, 'liveSellingItemID') || apiProduct.ID);
    define(object, 'liveSellingBadgeText', badgeText);
    define(object, 'liveSellingBadgeClass', liveSellingBadge ? liveSellingBadge.class : '');
    define(object, 'liveSellingBadgeStyle', liveSellingBadge && liveSellingBadge.style ? liveSellingBadge.style : '');
    define(object, 'liveSellingHostName', getSitePreferenceValue('liveSellingHostName'));
    define(object, 'liveSellingEventSummary', getSitePreferenceValue('liveSellingEventSummary'));
};
