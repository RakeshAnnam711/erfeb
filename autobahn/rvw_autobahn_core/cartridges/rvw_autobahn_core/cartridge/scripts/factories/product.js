'use strict';

var ArrayList = require('dw/util/ArrayList');
var ProductMgr = require('dw/catalog/ProductMgr');
var PromotionMgr = require('dw/campaign/PromotionMgr');

var bundleProductLineItem = require('*/cartridge/models/productLineItem/bundleLineItem');
var bonusProductLineItem = require('*/cartridge/models/productLineItem/bonusProductLineItem');
var bonusOrderLineItem = require('*/cartridge/models/productLineItem/bonusOrderLineItem');
var bundleOrderLineItem = require('*/cartridge/models/productLineItem/bundleOrderLineItem');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var productLineItem = require('*/cartridge/models/productLineItem/productLineItem');
var productTile = require('*/cartridge/models/product/productTile');
var orderLineItem = require('*/cartridge/models/productLineItem/orderLineItem');
var bonusProduct = require('*/cartridge/models/product/bonusProduct');

var base = module.superModule;

function get(params) {
    var productId = params.pid;
    var product = Object.create({ __proto__: null });
    var apiProduct = !empty(productId) ? ProductMgr.getProduct(productId) : null;
    if (apiProduct === null) {
        return product;
    }
    var productType = productHelper.getProductType(apiProduct);
    var options = null;
    var promotions;

    // we have to do a different approach for tile so we can preserve refinements, all others use base
    switch (params.pview) {
        case 'tile':
            var options = {
                optionModel: apiProduct.optionModel,
                variables: params.variables,
                quantity: 1
            }
            product = productTile(product, apiProduct, productType, params, options);
            break;
        case 'productLineItem':
            promotions = params.lineItem ? new ArrayList() : PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);

            if (params.lineItem) {
                let adjustmentIterator = params.lineItem.priceAdjustments.iterator();

                while (adjustmentIterator.hasNext()) {
                    let adjustment = adjustmentIterator.next();

                    if (adjustment && adjustment.promotion) {
                        promotions.push(adjustment.promotion);
                    }
                }
            }

            options = {
                promotions: promotions,
                quantity: params.quantity,
                variables: params.variables,
                lineItem: params.lineItem,
                productType: productType
            };

            if (productType !== 'bundle' || apiProduct.optionProduct) {
                var variationsPLI = productHelper.getVariationModel(apiProduct, params.variables);
                if (variationsPLI) {
                    apiProduct = variationsPLI.getSelectedVariant() || apiProduct; // eslint-disable-line
                }

                var optionModelPLI = apiProduct.optionModel;
                var optionLineItemsPLI = params.lineItem.optionProductLineItems;
                var currentOptionModelPLI = productHelper.getCurrentOptionModel(
                    optionModelPLI,
                    productHelper.getLineItemOptions(optionLineItemsPLI, productId)
                );
                var lineItemOptionsPLI = optionLineItemsPLI.length
                    ? productHelper.getLineItemOptionNames(optionLineItemsPLI)
                    : productHelper.getDefaultOptions(optionModelPLI, optionModelPLI.options);


                options.variationModel = variationsPLI;
                options.lineItemOptions = lineItemOptionsPLI;
                options.currentOptionModel = currentOptionModelPLI;
            }

            switch (productType) {
                case 'bundle':
                    if (params.containerView === 'order') {
                        product = bundleOrderLineItem(product, apiProduct, options, this);
                    } else {
                        product = bundleProductLineItem(product, apiProduct, options, this);
                    }
                    break;
                default:
                    if (params.containerView === 'order') {
                        product = orderLineItem(product, apiProduct, options);
                    } else {
                        product = productLineItem(product, apiProduct, options);
                    }
                    break;
            }
            break;
        case 'bonus':
            options = productHelper.getConfig(apiProduct, params);
            product = bonusProduct(product, apiProduct, options, params.duuid, this);
            break;
        case 'bonusProductLineItem':
            promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);
            options = {
                promotions: promotions,
                quantity: params.quantity,
                variables: params.variables,
                lineItem: params.lineItem,
                productType: productType
            };

            var variationsBundle = productHelper.getVariationModel(apiProduct, params.variables);
            if (variationsBundle) {
                apiProduct = variationsBundle.getSelectedVariant() || apiProduct; // eslint-disable-line
            }

            var optionModelBundle = apiProduct.optionModel;
            var optionLineItemsBundle = params.lineItem.optionProductLineItems;
            var currentOptionModelBundle = productHelper.getCurrentOptionModel(
                optionModelBundle,
                productHelper.getLineItemOptions(optionLineItemsBundle, productId)
            );
            var lineItemOptionsBundle = optionLineItemsBundle.length
                ? productHelper.getLineItemOptionNames(optionLineItemsBundle)
                : productHelper.getDefaultOptions(optionModelBundle, optionModelBundle.options);


            options.variationModel = variationsBundle;
            options.lineItemOptions = lineItemOptionsBundle;
            options.currentOptionModel = currentOptionModelBundle;

            if (params.containerView === 'order') {
                product = bonusOrderLineItem(product, apiProduct, options);
            } else {
                product = bonusProductLineItem(product, apiProduct, options);
            }
            break;
        default:
            product = base.get.apply(base, arguments);

            var abConfigs = require('*/cartridge/scripts/helpers/abConfigsHelper').getABConfigs();
            if (abConfigs.viewOutOfStockItems && abConfigs.viewBackInStockNotificationForm && !apiProduct.custom.backInStockNotificationDisabled) {
                var selectedAttrValues = (product.variationAttributes || []).map(function (attr) {
                    var selectedValue = ((attr && attr.values) || []).find(function (attrValue) {
                        return attrValue && attrValue.selected;
                    }) || false;

                    return selectedValue;
                });
                var allAttrsSelected = [true].concat(selectedAttrValues).reduce(function (allSelected, attrVal) {
                    return allSelected && !!attrVal; });
                var oosAttrsSelected = product.productType == 'variant' ? [false].concat(selectedAttrValues).reduce(function (oosSelected, attrVal) { return oosSelected || (attrVal && !attrVal.available); }) : !product.available;

                // Only Show BISN if all attrs are selected, the item exists, and there is no availabilty for simple products
                product.showBISN = allAttrsSelected && oosAttrsSelected && (product.productType === 'bundle' ? !product.available : product.readyToOrder);
            }
    }

    return product;
}


module.exports = {
    get: get
}

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});

