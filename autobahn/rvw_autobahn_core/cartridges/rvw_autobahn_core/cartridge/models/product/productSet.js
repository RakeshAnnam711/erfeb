'use strict';

var decorators = require('*/cartridge/models/product/decorators/index');
var pdpAssetIds = require('*/cartridge/models/product/decorators/pdpAssetIds');
var customProductPrefs = require('*/cartridge/models/product/decorators/customProductPreferences');
var pdpGalleryAssets = require('*/cartridge/models/product/decorators/pdpGalleryAssets');
var badges = require('*/cartridge/models/product/decorators/badges');
var headline = require('*/cartridge/models/product/decorators/headline');
var tabs = require('*/cartridge/models/product/decorators/tabs');
var collapsibleContent = require('*/cartridge/models/product/decorators/collapsibleContent');
var wishlist = require('*/cartridge/models/product/decorators/wishlist');
var getSetProductsLength = require('*/cartridge/models/product/decorators/setProductsCollection');
var recommendations = require('*/cartridge/models/product/decorators/recommendations');

/**
 * Decorate product with set product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @property {dw.catalog.ProductVariationModel} options.variationModel - Variation model returned by the API
 * @property {Object} options.options - Options provided on the query string
 * @property {dw.catalog.ProductOptionModel} options.optionModel - Options model returned by the API
 * @property {dw.util.Collection} options.promotions - Active promotions for a given product
 * @property {number} options.quantity - Current selected quantity
 * @property {Object} options.variables - Variables passed in on the query string
 * @param {Object} factory - Reference to product factory
 *
 * @returns {Object} - Set product
 */
module.exports = function setProduct(product, apiProduct, options, factory) {
    decorators.base(product, apiProduct, options.productType);
    decorators.price(product, apiProduct, options.promotions, false, options.options);
    decorators.quantity(product, apiProduct, options.quantity);
    decorators.description(product, apiProduct);
    decorators.promotions(product, options.promotions);
    decorators.currentUrl(product, options.variationModel, options.optionModel, 'Product-Show', apiProduct.ID, options.quantity);
    decorators.setIndividualProducts(product, apiProduct, factory);
    decorators.setReadyToOrder(product);
    decorators.raw(product, apiProduct);
    decorators.pageMetaData(product, apiProduct);
    decorators.template(product, apiProduct);

    decorators.online(product, apiProduct);
    decorators.images(product, apiProduct, { types: ['large', 'small', 'hi-res'], quantity: 'all' });
    decorators.ratings(product);
    decorators.attributes(product, apiProduct.attributeModel);
    decorators.availability(product, options.quantity, apiProduct.minOrderQuantity.value, apiProduct.availabilityModel);
    decorators.options(product, options.optionModel, options.variables, options.quantity);
    decorators.quantitySelector(product, apiProduct.stepQuantity.value, options.variables, options.options);
    var category = apiProduct.getPrimaryCategory()
        ? apiProduct.getPrimaryCategory()
        : apiProduct.getMasterProduct().getPrimaryCategory();
    decorators.sizeChart(product, category.custom.sizeChartID);
    customProductPrefs(product, apiProduct);
    pdpAssetIds(product, apiProduct);
    headline(product, apiProduct);
    pdpGalleryAssets(product, apiProduct);
    tabs(product, apiProduct);
    collapsibleContent(product, apiProduct);
    badges(product, apiProduct);
    wishlist(product, apiProduct);
    getSetProductsLength(product, apiProduct);
    recommendations(product, apiProduct);

    return product;
};
