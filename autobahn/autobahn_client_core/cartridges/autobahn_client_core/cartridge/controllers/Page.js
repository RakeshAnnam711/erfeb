'use strict';

var server = require('server');
server.extend(module.superModule);
var cache = require('*/cartridge/scripts/middleware/cache');

/**
 * Page-MegaMenuData : Async endpoint to load megamenu data (subcategories, images, assets)
 * This endpoint loads megamenu content asynchronously to improve initial page load performance
 */
server.get('MegaMenuData', server.middleware.include, cache.applyDefaultCache, function (req, res, next) {
    var catalogMgr = require('dw/catalog/CatalogMgr');
    var Categories = require('*/cartridge/models/categories');
    
    var categoryID = req.querystring.categoryID;
    var activeCategoryID = req.querystring.activecategory || null;
    
    if (!categoryID) {
        res.json({
            error: 'Category ID is required'
        });
        return next();
    }
    
    var category = catalogMgr.getCategory(categoryID);
    if (!category) {
        res.json({
            error: 'Category not found'
        });
        return next();
    }
    
    var navMenuCategoryDepth = res.viewData && res.viewData.abConfigs ? res.viewData.abConfigs.navMenuCategoryDepth : 2;
    var activeCategory = activeCategoryID && catalogMgr.getCategory(activeCategoryID);
    
    // Build category object with subcategories
    var categoryData = new Categories([category], navMenuCategoryDepth, activeCategory);
    var menuItem = categoryData.categories && categoryData.categories.length > 0 ? categoryData.categories[0] : null;
    
    if (!menuItem) {
        res.json({
            error: 'Menu item not found'
        });
        return next();
    }
    
    // Render megamenu template to get HTML
    res.render('components/header/megamenu', {
        category: menuItem,
        menuItem: menuItem,
        secondLevelCategory: menuItem.fullCategory || null,
        categories: categoryData.categories
    });
    
    next();
});

module.exports = server.exports();

