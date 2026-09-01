'use strict';

var CatalogMgr = require('dw/catalog/CatalogMgr');

var BaseAttributeValue = require('*/cartridge/models/search/attributeRefinementValue/base');

/**
 * @constructor
 * @classdesc Category attribute refinement value model
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - ProductSearchModel instance
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition
 * @param {dw.catalog.ProductSearchRefinementValue} refinementValue - Raw DW refinement value
 * @param {dw.catalog.Category} category - a Category instance
 * @param {boolean} selected - Selected flag
 * @param {string} actionEndpoint - optional actionEndpoint controller
 */
function CategoryAttributeValue(productSearch, refinementDefinition, refinementValue, category, selected, actionEndpoint) {
    this.productSearch = productSearch;
    this.refinementDefinition = refinementDefinition;
    // refinementValue for Category refinements is not a SearchRefinementValue subclass, thus presintationID lookup throws an error. Convert Category to standard object to allow undefined returns
    this.refinementValue = Object.assign({}, refinementValue);
    this.category = category;
    this.subCategories = [];
    this.selected = selected;

    this.initialize();
}

CategoryAttributeValue.prototype = Object.create(BaseAttributeValue.prototype);

CategoryAttributeValue.prototype.initialize = function () {
    var actionEndpoint = this.actionEndpoint || 'Search-Show'; // Triggers full refresh, can't be Search-ShowAjax
    var seoRefineEndpoint = this.seoRefineEndpoint || 'Search-Show'; // Triggers full refresh, can't be Search-ShowAjax

    BaseAttributeValue.prototype.initialize.call(this);
    this.actionEndpoint = actionEndpoint; // Update base initialize value
    this.seoRefineEndpoint = seoRefineEndpoint;

    this.type = 'category';
    this.selectable = true;
    this.id = this.category ? this.category.ID : this.refinementValue.value;

    this.displayValue = this.category ? this.category.displayName : this.refinementValue.displayValue;

    this.url = this.getUrl(
        this.productSearch,
        this.actionEndpoint,
        this.id,
        this.value,
        this.selected,
        this.selectable
    );
    this.seoRefineUrl = this.getUrl(
        this.productSearch,
        this.seoRefineEndpoint,
        this.id,
        this.value,
        this.selected,
        this.selectable
    );
    this.title = this.getTitle(
        this.selected,
        this.selectable,
        this.refinementDefinition.displayName,
        this.displayValue
    );
};

CategoryAttributeValue.prototype.getUrl = function (
    productSearch,
    actionEndpoint,
    id,
    value,
    selected) {
    var url = '';

    if (selected) {
        if (productSearch.category && productSearch.category.parent) {
            url = productSearch
                .urlRefineCategory(actionEndpoint, productSearch.category.parent.ID)
                .relative()
                .toString();
        } else {
            url = productSearch.urlRefineCategory(actionEndpoint, id).relative().toString();
        }
    } else {
        url = productSearch.urlRefineCategory(actionEndpoint, id).relative().toString();
    }

    return url;
};

module.exports = CategoryAttributeValue;

Object.keys(BaseAttributeValue).forEach(function (prop) {
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = BaseAttributeValue[prop];
    }
});
