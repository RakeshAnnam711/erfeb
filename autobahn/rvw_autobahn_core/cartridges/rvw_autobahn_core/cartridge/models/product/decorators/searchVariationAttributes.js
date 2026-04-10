'use strict';

var ATTRIBUTE_NAME = 'color';
var collections = require('*/cartridge/scripts/util/collections');
var URLUtils = require('dw/web/URLUtils');
var ImageModel = require('*/cartridge/models/product/productImages');
var ProductSearchHit = require('dw/catalog/ProductSearchHit');

module.exports = function (object, hit, selectedVariant) {

    var firstRepresentedProduct = !empty(selectedVariant) ? selectedVariant : hit.firstRepresentedProduct;
    var defaultColorID = !empty(selectedVariant) ? selectedVariant.custom.color : hit.firstRepresentedProduct.custom.color;

    var abConfigs = require('*/cartridge/scripts/helpers/abConfigsHelper').getABConfigs();
    var swatchAsImage = abConfigs.plpSwatchTypeAsImage || false;
    var variationModel = hit.getProduct().getVariationModel();
    var productVarAttr = variationModel.getProductVariationAttribute(ATTRIBUTE_NAME);

    var masterVarAttrValues = null;
    var variationModel = hit.getProduct().getVariationModel();
    var productVarAttr = variationModel.getProductVariationAttribute(ATTRIBUTE_NAME);
    if(hit.getHitType() == ProductSearchHit.HIT_TYPE_PRODUCT_MASTER) {
        masterVarAttrValues = !empty(productVarAttr) ? variationModel.getAllValues(productVarAttr) : null;
    }
    Object.defineProperty(object, 'variationAttributes', {
        enumerable: true,
        value: (function () {
            var colors = !empty(masterVarAttrValues) ? masterVarAttrValues : hit.getRepresentedVariationValues(ATTRIBUTE_NAME);

            return [{
                attributeId: 'color',
                id: 'color',
                swatchable: true,
                defaultColorID: defaultColorID,
                values: collections.map(colors, function (color) {
                    var apiImage;
                    var imageType;
                    var wishlistpid;
                    if (swatchAsImage) {
                        apiImage = new ImageModel(color, { types: ['card', 'thumbnail'], quantity: 'all' });
                        imageType = 'thumbnail';
                    }
                    else {
                        apiImage = new ImageModel(color, { types: ['card', 'swatch'], quantity: 'all' });
                        imageType = 'swatch';
                    }
                    if (!apiImage) {
                        return {};
                    }

                    if (firstRepresentedProduct.variationModel) {
                        if (firstRepresentedProduct.variationModel.productVariationAttributes.length === 1) {
                            var filter = new dw.util.HashMap();
                            filter.put(ATTRIBUTE_NAME, color.ID);
                            var variants = firstRepresentedProduct.variationModel.getVariants(filter);
                            if (variants && variants.length === 1) {
                                wishlistpid = variants[0].ID;
                            }
                        }
                    }

                    var isVariationAvailable = getAvailability(hit, productVarAttr, color);

                    return {
                        id: color.ID,
                        description: color.description,
                        displayValue: color.displayValue,
                        wishlistpid: wishlistpid,
                        value: color.value,
                        selectable: isVariationAvailable,
                        selected: defaultColorID == color.ID ? true : false,
                        available: isVariationAvailable,
                        images: apiImage,
                        imageType: imageType,
                        url: URLUtils.url(
                            'Product-Show',
                            'pid',
                            hit.productID,
                            'dwvar_' + hit.productID + '_color',
                            color.value
                        ).toString()
                    };
                })
            }];
        }())
    });
};

function getAvailability(hit, productVarAttr, color) {
    if (hit && productVarAttr && color) return hit.getProduct().getVariationModel().hasOrderableVariants(productVarAttr, color);
    return false;
};
