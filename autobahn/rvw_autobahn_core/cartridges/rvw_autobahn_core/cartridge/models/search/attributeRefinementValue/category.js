'use strict';

var CategoryAttributeValue = require('*/cartridge/models/search/attributeRefinementValue/categoryAttributeValue');

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
 */
function CategoryRefinementValueWrapper(productSearch, refinementDefinition, refinementValue, category, selected) {
    var value = new CategoryAttributeValue(
        productSearch,
        refinementDefinition,
        refinementValue,
        category,
        selected
    );

    this.items.forEach(function (item) {
        this[item] = value[item];
    }, this);
}

CategoryRefinementValueWrapper.prototype.items = [
    'id',
    'type',
    'displayValue',
    'selected',
    'selectable',
    'title',
    'url',
    'subCategories',
    'hitCount',
    'seoRefineUrl'
];

module.exports = CategoryRefinementValueWrapper;
