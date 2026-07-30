'use strict';

var collections = require('*/cartridge/scripts/util/collections');

function createAssetIdList(apiProduct) {
    var assetIds = [];
    var productAssetIds = !empty(apiProduct.custom) && !empty(apiProduct.custom.pdpAssetIds) ? apiProduct.custom.pdpAssetIds : [];
    var categories = !apiProduct.variant ? apiProduct.categories : apiProduct.masterProduct.categories;

    // Add product-level content assets
    productAssetIds.forEach(function(assetId) {
        assetIds.push(assetId);
    });

    // Add category-level content assets
    collections.forEach(categories, function(category) {
        var categoryAssetIds = !empty(category.custom) && !empty(category.custom.pdpAssetIds) ? category.custom.pdpAssetIds : [];
        categoryAssetIds.forEach(function(assetId) {
            assetIds.push(assetId);
        });
    });

    return assetIds;
}

module.exports = function(object, apiProduct) {
    Object.defineProperty(object, 'pdpAssetIds', {
        enumerable: true,
        value: createAssetIdList(apiProduct)
    });
};
