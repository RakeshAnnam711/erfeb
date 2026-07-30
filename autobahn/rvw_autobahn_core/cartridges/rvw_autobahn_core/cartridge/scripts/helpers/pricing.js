'use strict';

var base = module.superModule;

/**
 * Get list price for a given product
 * @param {dw.catalog.ProductSearchHit} hit - current product returned by Search API.
 *
 * @returns {Object} - price for a product
 */
function getListPrices(hit) {
    var minListPrice;
    var maxListPrice;
    // Loop through all represented products and get max and min price from root pricebook
    if (hit && hit.representedProducts && hit.hitType !== "bundle") {
        hit.representedProducts.toArray().forEach((product) => {
            if (!product.priceModel.priceInfo) {
                return {};
            }
            var rootPriceBook = base.getRootPriceBook(product.priceModel.priceInfo.priceBook);
            var minPricebookPrice = product.priceModel.getMinPriceBookPrice(rootPriceBook.ID);
            var maxPricebookPrice = product.priceModel.getMaxPriceBookPrice(rootPriceBook.ID);
            if (minListPrice == null || minPricebookPrice < minListPrice) {
                minListPrice = minPricebookPrice;
            }
            if (maxListPrice == null || maxPricebookPrice > maxListPrice) {
                maxListPrice = maxPricebookPrice;
            }
        });
    } else {
        return {
            minPrice: hit.minPrice,
            maxPrice: hit.maxPrice
        }
    }
    return {
        minPrice: minListPrice,
        maxPrice: maxListPrice
    }
}

base.getListPrices = getListPrices;

module.exports = base;