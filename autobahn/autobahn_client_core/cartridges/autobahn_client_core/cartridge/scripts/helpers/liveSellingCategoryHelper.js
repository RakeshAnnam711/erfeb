'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Site = require('dw/system/Site');

function getCustomBoolean(customAttributes, attributeID) {
    try {
        return !!(customAttributes && attributeID in customAttributes && customAttributes[attributeID]);
    } catch (e) {
        return false;
    }
}

// Live selling category ID from the liveSellingCategoryID Site Preference - null if unset, no fallback.
function getLiveSellingCategoryID() {
    try {
        var value = Site.getCurrent().getCustomPreferenceValue('liveSellingCategoryID');
        return value ? value.toString() : null;
    } catch (e) {
        return null;
    }
}

// True if the category matches the configured live selling category ID, or is separately flagged via its own isLiveSellingCategory attribute.
function isLiveSellingCategory(category) {
    if (!category) {
        return false;
    }

    try {
        var categoryID = category.ID || (typeof category.getID === 'function' && category.getID());
        var configuredCategoryID = getLiveSellingCategoryID();

        if (configuredCategoryID && categoryID === configuredCategoryID) {
            return true;
        }

        return getCustomBoolean(category.custom, 'isLiveSellingCategory');
    } catch (e) {
        return false;
    }
}

// True if the product is assigned (primary or otherwise) to any live selling category.
function isProductAssignedToLiveSellingCategory(product) {
    var foundLiveCategory = false;

    if (!product) {
        return false;
    }

    try {
        if (isLiveSellingCategory(product.primaryCategory)) {
            return true;
        }

        if (product.categories) {
            collections.forEach(product.categories, function (category) {
                if (isLiveSellingCategory(category)) {
                    foundLiveCategory = true;
                }
            });
        }
    } catch (e) {
        return false;
    }

    return foundLiveCategory;
}

module.exports = {
    getLiveSellingCategoryID: getLiveSellingCategoryID,
    isLiveSellingCategory: isLiveSellingCategory,
    isProductAssignedToLiveSellingCategory: isProductAssignedToLiveSellingCategory
};
