'use strict';

var decorators = require('*/cartridge/models/product/decorators/index');
var promotionCache = require('*/cartridge/scripts/util/promotionCache');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var badges = require('*/cartridge/models/product/decorators/badges');
var wishlist = require('*/cartridge/models/product/decorators/wishlist');
var setProductsImages = require('*/cartridge/models/product/decorators/setProductsImages');

/**
 * Decorate product with product tile information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {string} productType - Product type information
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function productTile(product, apiProduct, productType, params, options) {
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var productSearchHit = productHelper.getProductSearchHit(apiProduct, params);
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);
    var options = {
        optionModel: apiProduct.optionModel,
        variables: params.variables,
        quantity: 1
    }
    decorators.base(product, apiProduct, productType);
    decorators.searchPrice(product, productSearchHit, promotionCache.promotions, productHelper.getProductSearchHit, promotions);
    decorators.ratings(product);
    decorators.promotions(product, promotions);
    badges(product, apiProduct);

    if (productType === 'set') {
        decorators.setProductsCollection(product, apiProduct);
        setProductsImages(product, apiProduct, { types: ['card'], quantity: 'single' });
    }

    if (apiProduct.master) {
        var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
        var defaultVariantSettings = productHelpers.defaultVariantSettings(apiProduct);
        var selectedVariant = productSearchHit.firstRepresentedProduct;
        if (defaultVariantSettings.useDefaultVariant) {
            // the else case of this would only happen if the apiProduct is a master product that doesn't have a variation model, ie never
            // probably will need to add checks to see if refined by color and defaultVariant is in the list of represented products in the hit
            var joinedListIDs = productSearchHit.getRepresentedProductIDs();
            if (!empty(apiProduct.getVariationModel())) {
                var defaultVariant = apiProduct.getVariationModel().getDefaultVariant();
                if (joinedListIDs.indexOf(defaultVariant.ID) !== -1) {
                    // then the default Variant is in the represented items
                    selectedVariant = defaultVariant;
                }
            }
        }
        decorators.searchVariationAttributes(product, productSearchHit, selectedVariant);
        decorators.images(product, selectedVariant, { types: ['card'], quantity: 'all' });
    } else {
        decorators.searchVariationAttributes(product, productSearchHit, null);
        decorators.images(product, apiProduct, { types: ['card'], quantity: 'all' });
    }

    if (!empty(params.recommender)) {
        product.recommender = params.recommender;
    }

    //assuming we will always want to show first variant and link to it if it's selectable
    if (product.variationAttributes
        && product.variationAttributes[0]
        && product.variationAttributes[0].values.length > 0
        && product.variationAttributes[0].defaultColorID) {
        product.firstAttrValue = {
            //hardcoded to color in searchVariationAttributes
            groupId: product.variationAttributes[0].id || '',
            value: product.variationAttributes[0].defaultColorID || ''
        }
    } else {
        product.firstAttrValue = null;
    }
    // if product has 1 variant store variant ID in isOnlyVariant for quick add to cart
    if (apiProduct.variants.length < 2 && apiProduct.variationModel.variants.length < 2) {
        product.isOnlyVariant = apiProduct.variants.length === 1 ? apiProduct.variants[0].ID : apiProduct.ID;
    }

    if (apiProduct.primaryCategory && !empty(apiProduct.primaryCategory.ID)) {
        product.primaryCategory = apiProduct.primaryCategory.ID;
    } else if (apiProduct.variationModel && apiProduct.variationModel.master && apiProduct.variationModel.master.primaryCategory && !empty(apiProduct.variationModel.master.primaryCategory.ID)) {
        product.primaryCategory = apiProduct.variationModel.master.primaryCategory.ID;
    }
    decorators.options(product, options.optionModel, options.variables, options.quantity);

    wishlist(product, apiProduct, productSearchHit);

    return product;
};
