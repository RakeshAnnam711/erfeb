'use strict';

var SizeAttributeValue = require('*/cartridge/models/search/attributeRefinementValue/sizeAttributeValue.js');

/**
 * @constructor
 * @classdesc Size attribute refinement value model
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - ProductSearchModel instance
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition
 * @param {dw.catalog.ProductSearchRefinementValue} refinementValue - Raw DW refinement value
 */
function SizeRefinementValueWrapper(productSearch, refinementDefinition, refinementValue) {
    var value = new SizeAttributeValue(
        productSearch,
        refinementDefinition,
        refinementValue
    );

    this.items.forEach(function (item) {
        this[item] = value[item];
    }, this);
}

SizeRefinementValueWrapper.prototype.items = [
    'id',
    'type',
    'displayValue',
    'presentationId',
    'selected',
    'selectable',
    'title',
    'url',
    'hitCount',
    'seoRefineUrl'
];

module.exports = SizeRefinementValueWrapper;
