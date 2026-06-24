'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var URLUtils = require('dw/web/URLUtils');
var BasketMgr = require('dw/order/BasketMgr');

var sliderBuilder = require('*/cartridge/scripts/experience/utilities/sliderBuilder.js');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for storefront.carousel layout.
 * @param {dw.experience.ComponentScriptContext} context The component script context object.
 * @returns {string} The template to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var anchorArray = [];
    var content = context.content;
    var defaultTileURL = URLUtils.url('Tile-Show','pview', 'tile', 'ratings', content.displayRatings, 'swatches', content.displaySwatches, 'showQuickView', content.displayQuickview, 'showQuickAddToCart', content.displayQuickAddToCart, 'recommendation', 'true');

    model = sliderBuilder.init(model, context);

    model.containerClass = content.containerClass || '';
    model.uuid = require('dw/util/UUIDUtils').createUUID();
    model.urls = {
        tile: defaultTileURL.relative().toString()
    };
    model.limit = parseInt(content.count, 10) || 1;
    model.recommender = null;

    // Product Type
    if (empty(model.recommender) && content.recommenderproduct && !content.disableProductRecommender) {
        var products = [];

        if (content.product) {
            products.push(content.product);
        } else {
            var basket = BasketMgr.getCurrentBasket();
            if (basket) {
                (basket.getAllProductLineItems() || []).toArray().forEach(function (pli) {
                    if (pli && pli.product) products.push(pli.product);
                })
            }
        }

        if (products.length > 0) {
            // Loop through all products
            products.forEach(function (product) {
                var variant = product.master ? product.variationModel.defaultVariant : product;

                // Validate variant
                variant = !variant || !variant.variant ? (product.variationModel.variants.length > 0 && product.variationModel.variants[0]) : variant;

                var productJSON = {
                    id: (product.variant || product.variationGroup ? product.variationModel.master : product).ID,
                    sku: ((!variant || !variant.variant) ? product : variant).ID
                };

                if (product.variationGroup || product.bundle || product.productSet) {
                    if (product.productSet) {
                        productJSON.type = 'set';
                    } else if (product.bundle) {
                        productJSON.type = 'bundle';
                    } else if (product.variationGroup) {
                        productJSON.type = 'vgroup';
                    }
                }

                productJSON.alt_id = product.ID;

                anchorArray.push(productJSON);
            });

            if (anchorArray.length > 0) {
                model.recommender = content.recommenderproduct && content.recommenderproduct.value;
            }
        }
    }

    // Category Type
    if (empty(model.recommender) && content.category && !content.disableCategoryRecommender) {
        anchorArray.push({ id: content.category.ID });

        if (anchorArray.length > 0) {
            model.recommender = content.recommendercategory && content.recommendercategory.value;
        }
    }

    // Global Type
    if (empty(model.recommender) && !content.disableGlobalRecommender) {
        model.recommender = content.recommenderglobal && content.recommenderglobal.value;
    }

    // Add recommender rule
    if (!empty(model.recommender)) {
        model.urls.tile = defaultTileURL.append('recommender', model.recommender).relative().toString();
    }

    model.anchorArray = anchorArray.length > 0 ? anchorArray : null;

    return new Template('experience/components/commerce_layouts/einsteinSlider').render(model).text;
};
