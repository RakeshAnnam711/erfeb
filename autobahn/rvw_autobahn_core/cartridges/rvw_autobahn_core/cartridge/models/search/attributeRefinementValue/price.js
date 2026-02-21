'use strict';

var PriceAttributeValue = require('*/cartridge/models/search/attributeRefinementValue/priceAttributeValue');

/**
 * @constructor
 * @classdesc Price refinement value class
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - ProductSearchModel instance
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition
 * @param {dw.catalog.ProductSearchRefinementValue} refinementValue - Raw DW refinement value
 */
function PriceRefinementValueWrapper(productSearch, refinementDefinition, refinementValue) {
    var value = new PriceAttributeValue(
        productSearch,
        refinementDefinition,
        refinementValue
    );

    this.items.forEach(function (item) {
        this[item] = value[item];
    }, this);
}

PriceRefinementValueWrapper.prototype.items = [
    'displayValue',
    'selected',
    'title',
    'url',
    'hitCount',
    'seoRefineUrl'
];

module.exports = PriceRefinementValueWrapper;
