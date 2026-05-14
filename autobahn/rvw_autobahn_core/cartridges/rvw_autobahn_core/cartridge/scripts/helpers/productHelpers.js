'use strict';

var base = module.superModule;
var collections = require('*/cartridge/scripts/util/collections');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');

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
 * Normalize product and return Product variation model
 * Modied to display default variant if no attributes is preselected/passed as a selected value
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
                var isOrderAbleAttr = variationModel.hasOrderableVariants(dwAttr, dwAttrValue);

                if (dwAttr && dwAttrValue && isOrderAbleAttr) {
                    variationModel.setSelectedAttributeValue(dwAttr.ID, dwAttrValue.ID);
                    hasSelected = true;
                }
            }
        });

        variationModel = module.exports.preselectVariationAttributes(product, variationModel, hasSelected);
    } else if (variationModel.selectedVariant){
        variationModel = variationModel.selectedVariant.variationModel;
    } else {
        // if product.isVariationGroup() then hasSelected = true;
        var hasSelected = product.isVariationGroup();
        variationModel = module.exports.preselectVariationAttributes(product, variationModel, hasSelected);
    }

    return variationModel;
}


/**
 * Get information for model creation
 * @param {dw.catalog.Product} apiProduct - Product from the API
 * @param {Object} params - Parameters passed by querystring
 *
 * @returns {Object} - Config object
 */
function getConfig(apiProduct, params) {

    var variables = module.exports.normalizeSelectedAttributes(apiProduct, params);
    var variationModel = module.exports.getVariationModel(apiProduct, variables);
    if (variationModel && ('pview' in params ? params.pview !== 'bonus' : true)) {
        apiProduct = variationModel.selectedVariant || apiProduct; // eslint-disable-line
    }
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);
    var optionsModel = module.exports.getCurrentOptionModel(apiProduct.optionModel, params.options);
    var options = {
        variationModel: variationModel,
        options: params.options,
        optionModel: optionsModel,
        promotions: promotions,
        quantity: params.quantity,
        variables: variables,
        apiProduct: apiProduct,
        productType: module.exports.getProductType(apiProduct)
    };

    return options;
}

/**
 * Checks if a given category is in the same category path as the provided cgid param
 * @param {string} cgid
 * @param {dw.catalog.Category} category
 *
 * @returns {boolean}
 */
function checkIfInCategoryPath(cgid, category) {
    if (category.ID === cgid) {
        return true;
    } else if (category.parent && category.parent.ID !== 'root') {
        return checkIfInCategoryPath(cgid, category.parent);
    } else {
        return false;
    }
}

/**
 * Creates the breadcrumbs object
 * @param {string} cgid - category ID from navigation and search
 * @param {string} pid - product ID
 * @param {Array} breadcrumbs - array of breadcrumbs object
 * @returns {Array} an array of breadcrumb objects
 */
function getAllBreadcrumbs(cgid, pid, breadcrumbs) {
    var URLUtils = require('dw/web/URLUtils');
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');

    var category;
    var product;

    // Overriding base SFRA to keep correct category in context
    if (pid) {
        product = ProductMgr.getProduct(pid);
        var masterProduct = product.variant ? product.masterProduct : product;

        if (cgid) {
            var collections = require('*/cartridge/scripts/util/collections');
            var inCategoryPath = false;
            var categoryIterator = masterProduct.categories.iterator();

            while (categoryIterator.hasNext() && !inCategoryPath) {
                var productCategory = categoryIterator.next();
                inCategoryPath = checkIfInCategoryPath(cgid, productCategory);

                if (inCategoryPath) {
                    category = productCategory;
                }
            }
        }

        if (!category && !empty(masterProduct)) {
            category = masterProduct.primaryCategory || masterProduct.classificationCategory || (masterProduct.categories.length > 0 ? masterProduct.categories[0] : null);
        }

    } else if (cgid) {
        category = CatalogMgr.getCategory(cgid);
    }

    if (category) {
        breadcrumbs.push({
            htmlValue: category.displayName,
            url: URLUtils.url('Search-Show', 'cgid', category.ID)
        });

        if (category.parent && category.parent.ID !== 'root') {
            return getAllBreadcrumbs(category.parent.ID, null, breadcrumbs);
        }
    }

    return breadcrumbs;
}

/**
 * Generates a map of string resources for the template
 * adding unavailableMsg to the base resource strings
 *
 * @returns {ProductDetailPageResourceMap} - String resource map
 */
 function getResources() {
    var Resource = require('dw/web/Resource');
    var baseResources = base.getResources();
    baseResources.unavailableMsg = Resource.msg('product.option.unavailable', 'product', null);

    return baseResources;
}

 /**
  * Renders the Product Details Page
  * @param {Object} querystring - query string parameters
  * @param {Object} reqPageMetaData - request pageMetaData object
  * @param {Object} usePageDesignerTemplates - wether to use the page designer version of the product detail templates, defaults to false
  * @returns {Object} contain information needed to render the product page
  */
function showProductPage(querystring, reqPageMetaData) {
    var result = base.showProductPage.apply(base, arguments);

    if (result && result.product) {
        // Overwrite breadcrumbs to respect cgid param if present
        result.breadcrumbs = module.exports.getAllBreadcrumbs(querystring.cgid, result.product.id, []).reverse();
    }

    return result;
}

/**
 * This function pre selects variation attributes based on the sitePref / product attributes
 * variationAttributesToUse
 * useDefaultProductVariant
 * @param {dw.catalog.Product} product
 * @param {dw.catalog.ProductVariationModel} variationModel
 * @param {Boolean} hasSelected
 * @returns {dw.catalog.ProductVariationModel} variationModel
 */
function preselectVariationAttributes(product, variationModel, hasSelected) {

    var variantSettings = module.exports.defaultVariantSettings(product);

    // if its a variation group see if its by color - or ultimately by a variation attribute that we care about
    if(hasSelected) {
        collections.forEach(variationModel.getProductVariationAttributes(), function (attr) {
            var productVarAV = variationModel.getSelectedValue(attr);
            if(!empty(productVarAV) && variantSettings.attributeList.containsKey(attr.attributeID)) {
                variantSettings.attributeList.remove(attr.attributeID);
            }
        });
    }

    // If defaultVariant is used for pdp variant selection AND defaultVariant attributes are orderable
    if (!empty(variantSettings.useDefaultVariant) && variantSettings.useDefaultVariant === true ) {
        var defaultVariant = variationModel.getDefaultVariant();
        var defVarVM = defaultVariant.getVariationModel();
        collections.forEach(defVarVM.getProductVariationAttributes(), function(attr) {
            if(variantSettings.attributeList.containsKey(attr.attributeID)) {
                var productVarAV = defVarVM.getSelectedValue(attr);
                var isOrderableAttr = variationModel.hasOrderableVariants(attr, productVarAV);

                if (isOrderableAttr) {
                    variationModel.setSelectedAttributeValue(attr.ID, productVarAV.ID);

                    // Reduce ATTR List further
                    variantSettings.attributeList.remove(attr.attributeID);
                }
            }
        });
    }

    // If defaultVariant is NOT used for pdp variant selection OR defaultVariant attributes NOT orderable
    if (variantSettings.attributeList && variantSettings.attributeList.length > 0) {
        // select the first color way
        collections.forEach(variationModel.getProductVariationAttributes(), function(attr) {
            if(variantSettings.attributeList.containsKey(attr.attributeID)) {
                // get a list of values and grab the first one (should be the first colorway that shows)
                var listOfValues = variationModel.getFilteredValues(attr);
                var productVarAV = null;

                if (listOfValues.empty) {
                    listOfValues = variationModel.getAllValues(attr);
                }

                // Apply VarModel selection
                if (!listOfValues.empty) {
                    for (var i = 0; i < listOfValues.length; i++) {
                        if (variationModel.hasOrderableVariants(attr, listOfValues[i])) {
                            variationModel.setSelectedAttributeValue(attr.ID, listOfValues[i].ID);
                        }
                    }
                }
            }
        });
    }

    return variationModel;
}
/**
 * This function gets the default Product Variant settings
 * They exist at both the site and product level
 * first the function checks the product if the useDefaultVariant attribute is populated
 * if null it falls back on the site preference
 * In the case that they are null / empty in both places (product and site preference):
 * useDefaultVariant: will default to no and the master product's variationModel will be used
 * attributeList: will default to 'color'
 * @param {dw.order.Product} product
 */
function defaultVariantSettings(product) {
    var HashMap = require('dw/util/HashMap');
    var preferenceHelper = require('*/cartridge/scripts/helpers/preferenceHelper');

    var useDefaultVariant =  preferenceHelper.getAttributeValue('useDefaultProductVariant', product, 'useDefaultProductVariant');
    var attributeList = preferenceHelper.getAttributeValue('variationAttributesToUse', product, 'variationAttributesToUse');

    if (empty(attributeList)) {
        attributeList = new HashMap();
    } else {
        attributeList = JSON.parse(attributeList);
        var tempHash = new HashMap();
        Object.keys(attributeList).forEach(function (key) {
            if(!tempHash.containsKey(attributeList[key])) {
                tempHash.put(attributeList[key], attributeList[key]);
            }
        });
        attributeList = tempHash;
    }

    return {
        useDefaultVariant: useDefaultVariant,
        attributeList: attributeList
    };
}

/**
 * Get product search hit for a given product
 * @param {dw.catalog.Product} apiProduct - Product instance returned from the API
 * @returns {dw.catalog.ProductSearchHit} - product search hit for a given product
 */
function getProductSearchHit(apiProduct, params) {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var searchModel = new ProductSearchModel();

    if (!empty(params.cgid)) {
        searchModel.setCategoryID(params.cgid);
    }

    searchModel.setSearchPhrase(apiProduct.ID);
    searchModel.search();

    var availableRefinements = searchModel.refinements.refinementDefinitions;
    // add color refinement values
    if (params && !empty(params.key) && !empty(params.values)) {
        var refinementDefinition = availableRefinements && collections.find(availableRefinements, function (rdef) { return rdef.attributeID === params.key; });

        if (empty(availableRefinements) || availableRefinements.length === 0 || !empty(refinementDefinition)) {
            searchModel.addRefinementValues(params.key, params.values);
        }
    }
    searchModel.search();

    if (searchModel.count === 0) {
        searchModel.setSearchPhrase(apiProduct.ID.replace(/-/g, ' '));
        searchModel.search();
    }

    var hit = searchModel.getProductSearchHit(apiProduct);
    if (!hit && searchModel.getProductSearchHits().hasNext()) {
        var tempHit = searchModel.getProductSearchHits().next();
        if (tempHit.firstRepresentedProductID === apiProduct.ID) {
            hit = tempHit;
        }
    }
    return hit;
}

/**
 * Provides a current option model by setting selected option values
 *
 * @param {dw.catalog.ProductOptionModel} optionModel - Product's option model
 * @param {SelectedOption[]} selectedOptions - Options selected in UI
 * @return {dw.catalog.ProductOptionModel} - Option model updated with selected options
 */
function getCurrentOptionModel(optionModel, selectedOptions) {
    var productOptions = optionModel.options;

    if (selectedOptions && selectedOptions.length) {
        collections.forEach(productOptions, function (option) {
            for(var i in selectedOptions) {
                if (selectedOptions[i].optionId === option.ID) {
                    var selectedValue = optionModel.getOptionValue(option, selectedOptions[i].selectedValueId);
                    optionModel.setSelectedOptionValue(option, selectedValue);
                    break;
                }
            };
        });
    }

    return optionModel;
}

function getFullBreadcrumbs(cgid, product, breadcrumbs) {
    breadcrumbs.push({
        htmlValue: product.productName,
        url: ''
    });
    breadcrumbs.unshift({
            htmlValue: Resource.msg('global.home', 'common', null),
            url: URLUtils.home().toString()
        });
    return breadcrumbs;
}

module.exports = {
    preselectVariationAttributes: preselectVariationAttributes,
    defaultVariantSettings: defaultVariantSettings,
    getVariationModel: getVariationModel,
    getConfig: getConfig,
    getAllBreadcrumbs: getAllBreadcrumbs,
    getResources: getResources,
    showProductPage: showProductPage,
    getProductSearchHit: getProductSearchHit,
    normalizeSelectedAttributes: normalizeSelectedAttributes,
    getCurrentOptionModel: getCurrentOptionModel,
    getFullBreadcrumbs: getFullBreadcrumbs
}

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
