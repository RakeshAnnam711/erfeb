'use strict';

var base = module.superModule;
var collections = require('*/cartridge/scripts/util/collections');
var abConfigs = require('*/cartridge/scripts/helpers/abConfigsHelper').getABConfigs();

/**
 * Normalize product and return Product variation model
 * Modified to display default variant if no attributes is preselected/passed as a selected value
 * @param  {dw.catalog.Product} product - Product instance returned from the API
 * @param  {Object} productVariables - variables passed in the query string to target product variation group
 * @return {dw.catalog.ProductVariationModel} Normalized variation model
 */

function getVariationModel(product, productVariables) {
    var variationModel = product.variationModel;
    if (!variationModel.master && !variationModel.selectedVariant) {
        variationModel = null;
    } else if (productVariables && Object.keys(productVariables).length > 0) {
        var variationAttrs = variationModel.productVariationAttributes;
        var hasSelected = false;
        Object.keys(productVariables).forEach(function (attr) {
            if (attr && productVariables[attr].value) {
                var dwAttr = collections.find(variationAttrs,
                    function (item) { return item.ID === attr; });
                var dwAttrValue = collections.find(variationModel.getAllValues(dwAttr),
                    function (item) { return item.value === productVariables[attr].value; });
                // Avoid applying unorderable variant attr selections to variation model
                var outOfStockViewable = abConfigs.viewOutOfStockItems || false;
                var isOrderAbleAttr = !outOfStockViewable ? variationModel.hasOrderableVariants(dwAttr, dwAttrValue) : true;

                if (dwAttr && dwAttrValue && isOrderAbleAttr) {
                    variationModel.setSelectedAttributeValue(dwAttr.ID, dwAttrValue.ID);
                    hasSelected = true;
                }
            }
        });

        variationModel = base.preselectVariationAttributes(product, variationModel, hasSelected);
    } else if (variationModel.selectedVariant){
        variationModel = variationModel.selectedVariant.variationModel;
    } else {
        // if product.isVariationGroup() then hasSelected = true;
        var hasSelected = product.isVariationGroup();
        variationModel = base.preselectVariationAttributes(product, variationModel, hasSelected);
    }

    return variationModel;
};

if (abConfigs.viewOutOfStockItems) {
    // if out of stock is set to true replace this function to allow unorderable variant attr selections to variation model
    base.getVariationModel = getVariationModel;
}

module.exports = base;

