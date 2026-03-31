'use strict';

var ColorAttributeValue = require('*/cartridge/models/search/attributeRefinementValue/colorAttributeValue');

/**
 * @constructor
 * @classdesc Color attribute refinement value model
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - ProductSearchModel instance
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition
 * @param {dw.catalog.ProductSearchRefinementValue} refinementValue - Raw DW refinement value
 */
function ColorRefinementValueWrapper(productSearch, refinementDefinition, refinementValue) {
    var value = new ColorAttributeValue(
        productSearch,
        refinementDefinition,
        refinementValue
    );

    this.items.forEach(function (item) {
        this[item] = value[item];
    }, this);
}

ColorRefinementValueWrapper.prototype.items = [
    'id',
    'type',
    'displayValue',
    'presentationId',
    'selected',
    'selectable',
    'swatchId',
    'title',
    'url',
    'hitCount',
    'seoRefineUrl'
];

module.exports = ColorRefinementValueWrapper;
