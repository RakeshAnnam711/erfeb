'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var URLUtils = require('dw/web/URLUtils');

/**
 * Get category url
 * @param {dw.catalog.Category} category - Current category
 * @returns {string} - Url of the category
 */
function getCategoryUrl(category) {
    return category.custom && 'alternativeUrl' in category.custom && category.custom.alternativeUrl
        ? (category.custom.alternativeUrl.toString()).replace(/&amp;/g, '&')
        : URLUtils.url('Search-Show', 'cgid', category.getID()).toString();
}

/**
 * Converts a given category from dw.catalog.Category to plain object
 * @param {dw.catalog.Category} category - A single category
 * @param {Number} depth - optional, prevent recursive looping beyond specified depth
 * @param {dw.catalog.Category} childcategory - optional, target category ID to highlight and track within parents
 * @returns {Object} plain object that represents a category
 */
function categoryToObject(category, depth, childcategory) {
    if (!category.custom || (!category.custom.showInMenu && !category.custom.showInMenuAlways)) {
        return null;
    }
    var result = {
        name: category.getDisplayName(),
        url: getCategoryUrl(category),
        id: category.ID,
        megamenu: category.custom.enableMegamenu || false,
        contentSubLinksOnly: category.custom.contentSubLinksOnly || false,
        highlight: category.custom.menuHighlight || false,
        megamenuAsset1: category.custom.megamenuAsset1 || '',
        megamenuAsset2: category.custom.megamenuAsset2 || '',
        secondaryNav: category.custom.enableSecondaryNavMenu || false,
        showViewAllLink: category.custom.showViewAllLink || false,
        parentOfActive: !!childcategory && childcategory.isSubCategoryOf(category),
        active: !!childcategory && childcategory.ID === category.ID
    };
    var subCategories = category.hasOnlineSubCategories() ?
        category.getOnlineSubCategories() : null;

    if (result.megamenu) {
        result.fullCategory = category;
    }

    // if depth is not undefined/null decrement depth count, otherwise allow infinite recusion
    if ([undefined, null].indexOf(depth) === -1 && depth > 0) {
        depth -= 1;
    }

    if (subCategories && depth !== 0) {
        collections.forEach(subCategories, function (subcategory) {
            var converted = null;
            if (this.showInMenu(subcategory)) {
                converted = this.categoryToObject(subcategory, depth, childcategory);
            }
            if (converted) {
                if (!result.subCategories) {
                    result.subCategories = [];
                }
                result.subCategories.push(converted);
            }
        },
        this);
        if (result.subCategories) {
            result.complexSubCategories = result.subCategories.some(function (item) {
                return !!item.subCategories;
            });
        }
    }

    return result;
}

/**
 * This function applies the logic of whether or not this category can show in menu
 * @param {dw.catalog.Category} category
 */
 function showInMenu(category) {
    var returnValue = false;
    if (category.custom && (category.custom.showInMenu || category.custom.showInMenuAlways)) {
        // now check the other attribute
        // if its blank then do nothing
        if (category.custom.showInMenuAlways) {
            returnValue = true;
        } else {
            // just fall back on how it originally works
            if (category.hasOnlineProducts() || category.hasOnlineSubCategories()) {
                returnValue = true;
            }
        }
    }

    return returnValue;
}

/**
 * Represents a single category with all of it's children
 * @param {dw.util.ArrayList<dw.catalog.Category>} items - Top level categories
 * @param {Number} depth - optional, prevent recursive looping beyond specified depth
 * @param {dw.catalog.Category} childcategory - optional, target category ID to highlight and track within parents
 * @constructor
 */
function categories(items, depth, childcategory) {
    //Allow individual variable/function overrides
    this.categories = this.categories || [];
    this.showInMenu = this.showInMenu || showInMenu;
    this.getCategoryUrl = this.getCategoryUrl || getCategoryUrl;
    this.categoryToObject = this.categoryToObject || categoryToObject;

    collections.forEach(items, function (item) {
        if (this.showInMenu(item)) {
            this.categories.push(this.categoryToObject(item, depth, childcategory));
        }
    }, this);
}

module.exports = categories;
