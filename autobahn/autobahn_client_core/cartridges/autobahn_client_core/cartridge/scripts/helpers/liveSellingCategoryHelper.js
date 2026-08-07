'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Site = require('dw/system/Site');

var FALLBACK_CATEGORY_ID = 'live-selling-dev-products';

function getCustomBoolean(customAttributes, attributeID) {
    try {
        return !!(customAttributes && attributeID in customAttributes && customAttributes[attributeID]);
    } catch (e) {
        return false;
    }
}

/**
 * The primary live selling category ID, configurable via the liveSellingCategoryID Site Preference so it
 * does not need a code change to differ between environments (e.g. dev vs production). Falls back to the
 * original dev category ID if the preference is blank/unset.
 * @returns {string}
 */
function getLiveSellingCategoryID() {
    try {
        var value = Site.getCurrent().getCustomPreferenceValue('liveSellingCategoryID');
        return (value && value.toString()) || FALLBACK_CATEGORY_ID;
    } catch (e) {
        return FALLBACK_CATEGORY_ID;
    }
}

/**
 * True if the given category is the configured live selling category, or has separately been flagged as
 * one via its own isLiveSellingCategory custom attribute (lets additional categories opt in without a
 * Site Preference/code change).
 * @param {dw.catalog.Category} category
 * @returns {boolean}
 */
function isLiveSellingCategory(category) {
    if (!category) {
        return false;
    }

    try {
        var categoryID = category.ID || (typeof category.getID === 'function' && category.getID());

        if (categoryID === getLiveSellingCategoryID()) {
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
