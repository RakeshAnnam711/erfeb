'use strict';

var base = module.superModule;

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
    var globalePriceRefinementValue = require('*/cartridge/scripts/factories/globale/priceRefinementValue');
    base.call(this, productSearch, refinementDefinition, globalePriceRefinementValue(refinementValue));
}

PriceRefinementValueWrapper.prototype = Object.create(base.prototype);

module.exports = PriceRefinementValueWrapper;
