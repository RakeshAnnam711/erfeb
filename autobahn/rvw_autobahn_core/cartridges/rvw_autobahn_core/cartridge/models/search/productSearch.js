'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var searchRefinementsFactory = require('*/cartridge/scripts/factories/searchRefinements');
var base = module.superModule;
var URLUtils = require('dw/web/URLUtils');

var ACTION_ENDPOINT = 'Search-Show';
var ACTION_ENDPOINT_AJAX = 'Search-ShowAjax';

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
        if (!refinement.isCategoryRefinement) {
            selectedValues = refinement.values.filter(function (value) { return value.selected; });
            if (selectedValues.length) {
                selectedFilters.push.apply(selectedFilters, selectedValues);
            }
        }
    });

    return selectedFilters;
}

/**
 * Generates URL that removes refinements, essentially resetting search criteria
 *
 * @param {dw.catalog.ProductSearchModel} search - Product search object
 * @param {Object} httpParams - Query params
 * @param {string} [httpParams.q] - Search keywords
 * @param {string} [httpParams.cgid] - Category ID
 * @return {string} - URL to reset query to original search
 */
function getResetLink(search, httpParams, isAJAX) {
    var endpoint = !!isAJAX ? ACTION_ENDPOINT_AJAX : ACTION_ENDPOINT;

    return search.categorySearch
        ? URLUtils.url(endpoint, 'cgid', httpParams.cgid)
        : URLUtils.url(endpoint, 'q', httpParams.q);
}

/**
 * Retrieves search refinements
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {dw.catalog.ProductSearchRefinements} refinements - Search refinements
 * @param {ArrayList.<dw.catalog.ProductSearchRefinementDefinition>} refinementDefinitions - List of
 *     product serach refinement definitions
 * @return {Refinement[]} - List of parsed refinements
 */
function getRefinements(productSearch, refinements, refinementDefinitions) {
    return collections.map(refinementDefinitions, function (definition) {
        var refinementValues = refinements.getAllRefinementValues(definition);
        var values = searchRefinementsFactory.get(productSearch, definition, refinementValues);

        return {
            attributeID: !empty(definition.attributeID) && definition.attributeID.length > 0 ? definition.attributeID : definition.displayName,
            displayName: definition.displayName,
            isCategoryRefinement: definition.categoryRefinement,
            isAttributeRefinement: definition.attributeRefinement,
            isPriceRefinement: definition.priceRefinement,
            isPromotionRefinement: definition.promotionRefinement,
            values: values
        };
    });
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

    this.resetLink = getResetLink(productSearch, httpParams, false);
    this.resetAJAXLink = getResetLink(productSearch, httpParams, true);
}

ProductSearch.prototype = Object.create(base.prototype);

Object.defineProperty(ProductSearch.prototype, 'refinements', {
    get: function () {
        if (!this.cachedRefinements) {
            this.cachedRefinements = getRefinements(
                this.productSearch,
                this.productSearch.refinements,
                this.productSearch.refinements.refinementDefinitions
            );
        }

        return this.cachedRefinements;
    }
});

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
