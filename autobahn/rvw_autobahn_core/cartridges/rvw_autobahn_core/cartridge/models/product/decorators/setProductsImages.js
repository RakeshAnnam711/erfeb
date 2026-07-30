'use strict';

/**
 * @param {dw.catalog.Product} apiProduct - Product returned by the API
 *
 * @returns {[image[0]...]} an array of images from the first image of each individual product in set
 */
var ImageModel = require('*/cartridge/models/product/productImages');

function getSetProductsImages(object, apiProduct, config) {
    var images = [];
    for (var i = 0; i < object.numberOfProductsInSet; i++) {
        var product = apiProduct.productSetProducts[i];
        images.push(new ImageModel(product, config));
    }
    return images;
}

module.exports = function (object, apiProduct, config) {
    Object.defineProperty(object, 'setProductsImages', {
        enumerable: true,
        value: getSetProductsImages(object, apiProduct, config)
    });
};
