'use strict';

var PromotionAttributeValue = require('*/cartridge/models/search/attributeRefinementValue/promotionAttributeValue');

/**
 * @constructor
 * @classdesc Promotion refinement value model
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - ProductSearchModel instance
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition
 * @param {dw.catalog.ProductSearchRefinementValue} refinementValue - Raw DW refinement value
 * @param {boolean} selected - Selected flag
 */
function PromotionRefinementValueWrapper(
    productSearch,
    refinementDefinition,
    refinementValue,
    selected) {
    var value = new PromotionAttributeValue(
        productSearch,
        refinementDefinition,
        refinementValue,
        selected
    );

    this.items.forEach(function (item) {
        this[item] = value[item];
    }, this);
}

PromotionRefinementValueWrapper.prototype.items = [
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

module.exports = PromotionRefinementValueWrapper;
