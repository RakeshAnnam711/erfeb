'use strict';

var CatalogMgr = require('dw/catalog/CatalogMgr');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');

/**
 * Returns a list of default in-stock products for homepage recommendation fallback.
 * @param {number} limit - Max number of products to return
 * @returns {dw.catalog.Product[]} Default products
 */
function appendProductsFromCategory(category, maxProducts, products, seenProducts) {
    var productSearch;
    var hits;

    if (!category || products.length >= maxProducts) {
        return;
    }

    productSearch = new ProductSearchModel();
    productSearch.setCategoryID(category.ID);
    productSearch.setRecursiveCategorySearch(true);

    if (category.defaultSortingRule) {
        productSearch.setSortingRule(category.defaultSortingRule);
    }

    productSearch.setOrderableProductsOnly(true);
    productSearch.search();
    hits = productSearch.productSearchHits;

    while (hits && hits.hasNext() && products.length < maxProducts) {
        var hit = hits.next();
        var product = hit.product;

        if (!product || seenProducts[product.ID]) {
            continue;
        }

        if (product.availabilityModel.inStock) {
            seenProducts[product.ID] = true;
            products.push(product);
        }
    }
}

function getDefaultProducts(limit) {
    var products = [];
    var fallbackCategory = CatalogMgr.getCategory('new-arrivals');
    var maxProducts = limit || 10;
    var seenProducts = {};

    appendProductsFromCategory(fallbackCategory, maxProducts, products, seenProducts);

    return products;
}

/**
 * Checks whether a recommendation collection contains products.
 * @param {Array|dw.util.Collection} products - Product collection to validate
 * @returns {boolean} Whether products are available
 */
function hasProducts(products) {
    if (!products) {
        return false;
    }

    if (typeof products.length === 'number') {
        return products.length > 0;
    }

    if (typeof products.size === 'function') {
        return products.size() > 0;
    }

    return false;
}

module.exports = {
    getDefaultProducts: getDefaultProducts,
    hasProducts: hasProducts
};
