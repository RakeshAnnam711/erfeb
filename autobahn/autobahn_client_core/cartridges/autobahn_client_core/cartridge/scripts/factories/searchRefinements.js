var collections = require('*/cartridge/scripts/util/collections');

var base = module.superModule;

/**
 * Retrieves attribute refinement value model
 *
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition for which we wish to retrieve refinement values for
 * @return {Object} - Attribute refinement value model module
 */
function getAttributeRefinementValueModel(refinementDefinition) {
    if (refinementDefinition.priceRefinement) {
        return require('*/cartridge/models/search/attributeRefinementValue/price');
    } else if (refinementDefinition.attributeID === 'refinementColor') {
        return require('*/cartridge/models/search/attributeRefinementValue/color');
    } else if (refinementDefinition.attributeID === 'size') {
        return require('*/cartridge/models/search/attributeRefinementValue/size');
    } else if (refinementDefinition.categoryRefinement) {
        return require('*/cartridge/models/search/attributeRefinementValue/category');
    } else if (refinementDefinition.promotionRefinement) {
        return require('*/cartridge/models/search/attributeRefinementValue/promotion');
    }

    return require('*/cartridge/models/search/attributeRefinementValue/boolean');
}

/**
 * Creates an array of category refinements for category search
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition for which we wish to retrieve refinement values for
 * @param {CategoryAttributeValue} Model - model of the category class
 * @return {Array} - List of categories
 */
function createCategorySearchRefinement(productSearch, refinementDefinition, refinementValues, Model) {
    var currentCategory = productSearch.category;
    var topCategory = null;
    var rootCategory = null;

    if (currentCategory) {
        if (currentCategory.parent.root) {
            topCategory = new Model(productSearch, refinementDefinition, refinementValues, currentCategory, true);
            collections.forEach(currentCategory.subCategories, function (category) {
                if (category.online) {
                    var subCategory = new Model(productSearch, refinementDefinition, refinementValues, category);
                    if (subCategory) {
                        topCategory.subCategories.push(subCategory);
                    }
                }
            });
        } else {
            rootCategory = currentCategory;
            var categoryList = [];
            categoryList.push(rootCategory.ID);
            while(!rootCategory.parent.root) {
                rootCategory = rootCategory.parent;
                categoryList.push(rootCategory.ID);
            }
            topCategory = new Model(productSearch, refinementDefinition, refinementValues, rootCategory);
            collections.forEach(rootCategory.subCategories, function (category) {
                if (category.online) {
                    var subCategory = null;
                    if (categoryList.includes(category.ID)) {
                        subCategory = mapCategoryHierarchy(productSearch, refinementDefinition, refinementValues, category, Model, currentCategory.ID);
                    } else {
                        subCategory = new Model(productSearch, refinementDefinition, refinementValues, category);
                    }
                    if (subCategory) {
                        topCategory.subCategories.push(subCategory);
                    }
                }
            });
        }
    }

    return [topCategory];
}

/**
 * Creates an category refinements for subCategory recursivly.
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition for which we wish to retrieve refinement values for
 * @param {dw.catalog.ProductSearchModel.Category} category - Category Object
 * @param {CategoryAttributeValue} Model - model of the category class
 * @param {string} currentCategoryId - selected category id
 * @return {CategoryAttributeValue} - List of categories
 */
function mapCategoryHierarchy(productSearch, refinementDefinition, refinementValues, category, Model, currentCategoryId) {
    var isSelected = currentCategoryId == category.ID;
    var categoryModel = new Model(productSearch, refinementDefinition, refinementValues, category, isSelected);
    collections.forEach(category.subCategories, function (subCategory) {
        if (subCategory && subCategory.online) {
            categoryModel.subCategories.push(mapCategoryHierarchy(productSearch, refinementDefinition, refinementValues, subCategory, Model, currentCategoryId));
        }
    });
    return categoryModel;
}

/**
 * Creates an array of category refinements for category search
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition for which we wish to retrieve refinement values for
 * @param {dw.util.Collection.<dw.catalog.ProductSearchRefinementValue>} refinementValues -
 *     Collection of refinement values
 * @param {CategoryAttributeValue} Model - model of the category class
 * @return {Array} - List of categories
 */
function createProductSearchRefinement(productSearch,
    refinementDefinition,
    refinementValues,
    Model) {
    var catalogMgr = require('dw/catalog/CatalogMgr');
    var tree = [];
    var mappedList = {};
    collections.forEach(refinementValues, function (value) {
        var category = catalogMgr.getCategory(value.value);
        mappedList[value.value] = new Model(
            productSearch,
            refinementDefinition,
            category,
            productSearch.categoryID === value.value);
        mappedList[value.value].parent = category.parent.ID;
    });

    Object.keys(mappedList).forEach(function (key) {
        var category = mappedList[key];
        if (category.parent !== 'root') {
            if (mappedList[category.parent]) {
                mappedList[category.parent].subCategories.push(category);
            }
        } else {
            tree.push(category);
        }
    });
    return tree;
}

/**
 * Retrieve refinement values based on refinement type
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition for which we wish to retrieve refinement values for
 * @param {dw.util.Collection.<dw.catalog.ProductSearchRefinementValue>} refinementValues -
 *     Collection of refinement values
 * @return {Array} - List of refinement values
 */
function get(productSearch, refinementDefinition, refinementValues) {
    var Model = getAttributeRefinementValueModel(refinementDefinition);

    if (refinementDefinition.categoryRefinement) {
        if (productSearch.categorySearch) {
            // return only current category, direct children and direct parent
            return createCategorySearchRefinement(productSearch, refinementDefinition, refinementValues, Model);
        }
        return createProductSearchRefinement(
            productSearch,
            refinementDefinition,
            refinementValues,
            Model);
    }

    return collections.map(refinementValues, function (value) {
        return new Model(productSearch, refinementDefinition, value);
    });
}

base.get = get;
module.exports = base;
