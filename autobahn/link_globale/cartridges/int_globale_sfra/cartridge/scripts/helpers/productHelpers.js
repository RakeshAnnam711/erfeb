'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');
var base = module.superModule;

/**
 * @typedef {Object} ProductOptionValues
 * @type Object
 * @property {string} id - Product option value ID
 * @property {string} displayValue - Option value's display value
 * @property {string} price - Option values' price
 */

/**
 * Get a product option's values
 *
 * @param {dw.catalog.ProductOptionModel} optionModel - A product's option model
 * @param {dw.catalog.ProductOption} option - A product's option
 * @param {dw.util.Collection<dw.catalog.ProductOptionValue>} optionValues - Product option values
 * @param {Object} attributeVariables - Variation attribute query params
 * @return {ProductOptionValues} - View model for a product option's values
 */
function getOptionValues(optionModel, option, optionValues, attributeVariables) {
    var globaleOptionModel = require('*/cartridge/scripts/factories/globale/optionModel');
    var action = 'Product-Variation';
    optionModel = globaleOptionModel(optionModel); // eslint-disable-line no-param-reassign
    var values = collections.map(optionValues, function (value) {
        var priceValue = optionModel.getPrice(value);
        var optionUrl = optionModel.urlSelectOptionValue(action, option, value);
        var url = urlHelper.appendQueryParams(optionUrl, attributeVariables);
        return {
            id: value.ID,
            displayValue: value.displayValue,
            price: priceValue.toFormattedString(),
            priceValue: priceValue.decimalValue,
            url: url
        };
    });

    return values.sort(function (a, b) {
        return a.priceValue - b.priceValue;
    });
}

/**
 * @typedef {Object} ProductOptions
 *
 * @property {string} id - Product option ID
 * @property {string} name - Product option name
 * @property {string} htmlName - HTML representation of product option name
 * @property {ProductOptionValues} values - A product option's values
 * @property {string} selectedValueId - Selected option value ID
 */

/**
 * Retrieve provided product's options
 *
 * @param {dw.catalog.ProductOptionModel} optionModel - Product's option model
 * @param {Object} attributeVariables - Variation attribute query params
 * @return {ProductOptions[]} - Parsed options for this product
 */
function getOptions(optionModel, attributeVariables) {
    return collections.map(optionModel.options, function (option) {
        return {
            id: option.ID,
            name: option.displayName,
            htmlName: option.htmlName,
            values: getOptionValues(optionModel, option, option.optionValues, attributeVariables),
            selectedValueId: optionModel.getSelectedOptionValue(option).ID
        };
    });
}

/**
 * If a product is master and only have one variant for a given attribute - auto select it
 * @param {dw.catalog.Product} apiProduct - Product from the API
 * @param {Object} params - Parameters passed by querystring
 *
 * @returns {Object} - Object with selected parameters
 */
function normalizeSelectedAttributes(apiProduct, params) {
    if (!apiProduct.master) {
        return params.variables;
    }

    var variables = params.variables || {};
    if (apiProduct.variationModel) {
        collections.forEach(apiProduct.variationModel.productVariationAttributes, function (attribute) {
            var allValues = apiProduct.variationModel.getAllValues(attribute);
            if (allValues.length === 1) {
                variables[attribute.ID] = {
                    id: apiProduct.ID,
                    value: allValues.get(0).ID
                };
            }
        });
    }

    return Object.keys(variables) ? variables : null;
}

/**
 * Get information for model creation
 * @param {dw.catalog.Product} apiProduct - Product from the API
 * @param {Object} params - Parameters passed by querystring
 *
 * @returns {Object} - Config object
 */
function getConfig(apiProduct, params) {
    var globalePromotionPlan = require('*/cartridge/scripts/factories/globale/promotionPlan');

    var variables = normalizeSelectedAttributes(apiProduct, params);
    var variationModel = base.getVariationModel(apiProduct, variables);
    if (variationModel) {
        apiProduct = variationModel.selectedVariant || apiProduct; // eslint-disable-line
    }
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var promotions = globalePromotionPlan(PromotionMgr.activeCustomerPromotions).getProductPromotions(apiProduct);
    var optionsModel = base.getCurrentOptionModel(apiProduct.optionModel, params.options);
    var options = {
        variationModel: variationModel,
        options: params.options,
        optionModel: optionsModel,
        promotions: promotions,
        quantity: params.quantity,
        variables: variables,
        apiProduct: apiProduct,
        productType: base.getProductType(apiProduct)
    };

    return options;
}

module.exports = base;
module.exports.getOptionValues = getOptionValues;
module.exports.getOptions = getOptions;
module.exports.getConfig = getConfig;
