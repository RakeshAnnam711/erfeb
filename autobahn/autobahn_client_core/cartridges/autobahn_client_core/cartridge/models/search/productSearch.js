'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var searchRefinementsFactory = require('*/cartridge/scripts/factories/searchRefinements');
var base = module.superModule;
var URLUtils = require('dw/web/URLUtils');
var liveSellingCategoryHelper = require('*/cartridge/scripts/helpers/liveSellingCategoryHelper');

var ACTION_ENDPOINT_AJAX = 'Search-Show';

/**
 * Returns the refinement values that have been selected
 *
 * @param {Array.<CategoryRefinementValue|AttributeRefinementValue|PriceRefinementValue>}
 *     refinements - List of all relevant refinements for this search
 * @return {Object[]} - List of selected filters
 */
function getSelectedFilters(refinements) {
    var selectedFilters = [];
    var selectedValues = [];

    refinements.forEach(function (refinement) {
        if (refinement.isCategoryRefinement) {
            var selectedCategories = [];
            getAllSelelectedCategories(refinement.values, selectedCategories, true);
            selectedValues = selectedCategories;
        } else {
            selectedValues = refinement.values.filter(function (value) { return value.selected; });
        }
        if (selectedValues.length) {
            selectedFilters.push.apply(selectedFilters, selectedValues);
        }
    });
    return selectedFilters;
}

function getAllSelelectedCategories(categories, selectedCategories, isRoot) {
    if (categories && Array.isArray(categories)) {
        categories.forEach(category => {
            if (category.selected) {
                if (!isRoot) {
                    selectedCategories.push(category);
                }
            } else if (category.subCategories && Array.isArray(category.subCategories)){
                getAllSelelectedCategories(category.subCategories, selectedCategories, false);
            }
        });
    }
}

/**
 * @constructor
 * @classdesc ProductSearch class
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {Object} httpParams - HTTP query parameters
 * @param {string} sortingRule - Sorting option rule ID
 * @param {dw.util.ArrayList.<dw.catalog.SortingOption>} sortingOptions - Options to sort search
 *     results
 * @param {dw.catalog.Category} rootCategory - Search result's root category if applicable
 */
function ProductSearch(productSearch, httpParams, sortingRule, sortingOptions, rootCategory) {
    if (httpParams.srule) {
        sortingRule = httpParams.srule;
    }
    base.apply(this, arguments);

    // Live selling products are only browsable on their own category page; filtered by category assignment (not the boolean attribute) to avoid search-index refinement quirks.
    var isViewingLiveSellingCategory = liveSellingCategoryHelper.isLiveSellingCategory(productSearch && productSearch.category);

    if (!isViewingLiveSellingCategory && this.productIds) {
        this.productIds = this.productIds.filter(function (item) {
            try {
                var product = item.productSearchHit && item.productSearchHit.product;
                return !liveSellingCategoryHelper.isProductAssignedToLiveSellingCategory(product);
            } catch (e) {
                return true;
            }
        });
    }
}

ProductSearch.prototype = Object.create(base.prototype);

Object.defineProperty(ProductSearch.prototype, 'selectedFilters', {
    get: function () {
        return getSelectedFilters(this.refinements);
    }
});

module.exports = ProductSearch;

Object.keys(base).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
