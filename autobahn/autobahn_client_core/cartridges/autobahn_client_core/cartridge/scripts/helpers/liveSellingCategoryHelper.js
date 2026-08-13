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

/**
 * The primary live selling category ID, configurable via the liveSellingCategoryID Site Preference. No
 * fallback - if the preference is blank/unset, this returns null and ID-based matching is skipped
 * entirely (a category can then only qualify via its own isLiveSellingCategory custom attribute).
 * @returns {string|null}
 */
function getLiveSellingCategoryID() {
    try {
        var value = Site.getCurrent().getCustomPreferenceValue('liveSellingCategoryID');
        return value ? value.toString() : null;
    } catch (e) {
        return null;
    }
}

/**
 * True if the given category matches the configured live selling category ID (when that Site Preference
 * is set), or has separately been flagged as one via its own isLiveSellingCategory custom attribute (lets
 * additional categories opt in independent of the Site Preference).
 * @param {dw.catalog.Category} category
 * @returns {boolean}
 */
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

/**
 * True if the given product is assigned (primary or otherwise) to any live selling category.
 * @param {dw.catalog.Product} product
 * @returns {boolean}
 */
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
