'use strict';

var URLUtils = require('dw/web/URLUtils');
var collections = require('*/cartridge/scripts/util/collections');

module.exports = function (object, apiProduct, options) {
    var brand = apiProduct.brand;
    var categories = apiProduct.categories;
    var brandLink = null;

    collections.forEach(categories, function (category) {
        if (category.displayName.toLowerCase() === brand.toLowerCase()) {
            brandLink = URLUtils.url('Search-Show', 'cgid', category.getID()).toString();
        }
    });

    Object.defineProperty(object, 'brandLink', {
        enumerable: true,
        value: brandLink,
    });
};
