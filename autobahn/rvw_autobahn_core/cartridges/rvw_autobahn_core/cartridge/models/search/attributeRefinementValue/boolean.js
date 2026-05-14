'use strict';

var BooleanAttributeValue = require('*/cartridge/models/search/attributeRefinementValue/booleanAttributeValue');

/**
 * @constructor
 * @classdesc Boolean attribute refinement value model
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - ProductSearchModel instance
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition
 * @param {dw.catalog.ProductSearchRefinementValue} refinementValue - Raw DW refinement value
 */
function BooleanRefinementValueWrapper(productSearch, refinementDefinition, refinementValue) {
    var value = new BooleanAttributeValue(
        productSearch,
        refinementDefinition,
        refinementValue
    );

    this.items.forEach(function (item) {
        this[item] = value[item];
    }, this);
}

BooleanRefinementValueWrapper.prototype.items = [
    'id',
    'type',
    'displayValue',
    'selected',
    'selectable',
    'title',
    'url',
    'hitCount',
    'seoRefineUrl'
];

module.exports = BooleanRefinementValueWrapper;
