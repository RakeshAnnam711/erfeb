'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var CatalogMgr = require('dw/catalog/CatalogMgr');

var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

// Iterate through categories and subcategories and apply 'show' attribute to selected categories
function filterCategories(category, categoryIds) {
    if (categoryIds && categoryIds.indexOf(category.id) !== -1) {
        category.show = true;
    } else {
        category.show = false;
    }

    if (category.subCategories && category.subCategories.length > 0) {
        category.subCategories.forEach(subCategory => {
            filterCategories(subCategory, categoryIds);
        });
    }
}

/**
 * Render logic for categoryNav.
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    var categoryData = content.categoryData;
    var menuLevels = 4; // update this value to add deeper nested class options

    if (categoryData) {
        var categoryIds = categoryData.selectedIds;
        var CategoriesModel = require('*/cartridge/models/categories');
        var selectedRootCategoryId = !empty(categoryData.rootCategory) ? categoryData.rootCategory : null;
        var rootCategory = CatalogMgr.getCategory(selectedRootCategoryId) || CatalogMgr.getSiteCatalog().getRoot();
        var topLevelCategories = rootCategory.hasOnlineSubCategories() ? rootCategory.getOnlineSubCategories() : null;
        var categoryObject = new CategoriesModel(topLevelCategories).categories;

        categoryObject.forEach(category => {
            filterCategories(category, categoryIds);
        });

        model.categories = categoryObject;
    }

    model.containerClass = content.containerClass || '';
    model.title = content.title || null;
    model.titleClass = content.titleClass || '';

    for (let index = 0; index < menuLevels; index++) {
        model['listClass' + (index + 1)] = content['listClass' + (index + 1)] || '';
        model['itemClass' + (index + 1)] = content['itemClass' + (index + 1)] || '';
        model['linkClass' + (index + 1)] = content['linkClass' + (index + 1)] || '';
    }

    return new Template('experience/components/commerce_assets/categoryNav').render(model).text;
};
