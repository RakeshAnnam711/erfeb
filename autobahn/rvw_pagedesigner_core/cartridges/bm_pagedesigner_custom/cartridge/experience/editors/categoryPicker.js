'use strict';

module.exports.init = editor => {
    var catalogMgr = require('dw/catalog/CatalogMgr');
    var CategoriesModel = require('*/cartridge/models/categories');
    var siteRootCategory = catalogMgr.getSiteCatalog().getRoot();
    var topLevelCategories = siteRootCategory.hasOnlineSubCategories() ? siteRootCategory.getOnlineSubCategories() : null;
    var categoryObject = new CategoriesModel(topLevelCategories).categories;

    // Pass initial category data to categoryPickerScript.js
    editor.configuration.put('init', categoryObject);
}
