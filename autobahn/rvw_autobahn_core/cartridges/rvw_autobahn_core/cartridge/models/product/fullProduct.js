'use strict';

var decorators = require('*/cartridge/models/product/decorators/index');
var recommendations = require('*/cartridge/models/product/decorators/recommendations');
var pdpAssetIds = require('*/cartridge/models/product/decorators/pdpAssetIds');
var pdpGalleryAssets = require('*/cartridge/models/product/decorators/pdpGalleryAssets');
var badges = require('*/cartridge/models/product/decorators/badges');
var selectedColorName = require('*/cartridge/models/product/decorators/selectedColorName');
var customProductPrefs = require('*/cartridge/models/product/decorators/customProductPreferences');
var headline = require('*/cartridge/models/product/decorators/headline');
var tabs = require('*/cartridge/models/product/decorators/tabs');
var collapsibleContent = require('*/cartridge/models/product/decorators/collapsibleContent');
var wishlist = require('*/cartridge/models/product/decorators/wishlist');
var itemType = require('*/cartridge/models/product/decorators/itemType');

/**
 * Decorate product with full product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @property {dw.catalog.ProductVariationModel} options.variationModel - Variation model returned by the API
 * @property {Object} options.options - Options provided on the query string
 * @property {dw.catalog.ProductOptionModel} options.optionModel - Options model returned by the API
 * @property {dw.util.Collection} options.promotions - Active promotions for a given product
 * @property {number} options.quantity - Current selected quantity
 * @property {Object} options.variables - Variables passed in on the query string
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function fullProduct(product, apiProduct, options) {
    decorators.base(product, apiProduct, options.productType);
    customProductPrefs(product, apiProduct, options);
    decorators.price(product, apiProduct, options.promotions, false, options.optionModel);

    if (options.variationModel) {
        decorators.images(product, options.variationModel, { types: ['large', 'small', 'hi-res'], quantity: 'all' });
    } else {
        decorators.images(product, apiProduct, { types: ['large', 'small', 'hi-res'], quantity: 'all' });
    }

    decorators.quantity(product, apiProduct, options.quantity);
    decorators.variationAttributes(product, options.variationModel, {
        attributes: '*',
        endPoint: 'Variation',
        attrsToUseForSwatch: product.attrsToUseForSwatch,
        pdpSwatchTypeAsImage: product.pdpSwatchTypeAsImage
    });
    decorators.description(product, apiProduct);
    decorators.ratings(product);
    decorators.promotions(product, options.promotions);
    decorators.attributes(product, apiProduct.attributeModel);
    decorators.availability(product, options.quantity, apiProduct.minOrderQuantity.value, apiProduct.availabilityModel);
    decorators.options(product, options.optionModel, options.variables, options.quantity);
    decorators.quantitySelector(product, apiProduct.stepQuantity.value, options.variables, options.options);

    if ('sizeChartOverride' in options.apiProduct.custom && options.apiProduct.custom.sizeChartOverride !== '') {
        decorators.sizeChart(product, options.apiProduct.custom.sizeChartOverride);
    } else {
        var category = apiProduct.getPrimaryCategory();

        if (!category && (options.productType === 'variant' || options.productType === 'variationGroup')) {
            category = apiProduct.getMasterProduct().getPrimaryCategory();
        }

        if (category && 'sizeChartID' in category.custom) {
            decorators.sizeChart(product, category.custom.sizeChartID);
        }
    }

    decorators.currentUrl(product, options.variationModel, options.optionModel, 'Product-Show', apiProduct.ID, options.quantity);
    decorators.readyToOrder(product, options.variationModel);
    decorators.online(product, apiProduct);
    decorators.raw(product, apiProduct);
    decorators.pageMetaData(product, apiProduct);
    decorators.template(product, apiProduct);
    headline(product, apiProduct);
    recommendations(product, apiProduct);
    pdpAssetIds(product, apiProduct);
    pdpGalleryAssets(product, apiProduct);
    tabs(product, apiProduct);
    collapsibleContent(product, apiProduct);
    badges(product, apiProduct);
    selectedColorName(product, product);
    wishlist(product, apiProduct);
    itemType(product, apiProduct);

    return product;
};
