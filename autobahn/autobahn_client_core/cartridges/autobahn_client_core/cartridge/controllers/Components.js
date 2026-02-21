'use strict';

var server = require('server');

/**
 * Components-SliderCategoryProducts : This endpoint is used by the sliderCategoryProducts page designer component so that it can have a separate caching interval from the page the component is on
 */
server.get('SliderCategoryProducts', function (req, res, next) {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var CatalogMgr = require('dw/catalog/CatalogMgr');

    var productsArray = [];

    // Get data from querystring
    var categoryID = String(req.querystring.categoryID);
    var productsToDisplay = parseInt(String(req.querystring.productsToDisplay));
    var display = String(req.querystring.display);
    var section = String(req.querystring.section || '');

    // Get category and perform search
    var category = CatalogMgr.getCategory(categoryID);
    if (category) {
        var searchModel = new ProductSearchModel();
        searchModel.setCategoryID(category.ID);
        searchModel.setSortingRule(category.getDefaultSortingRule());
        searchModel.search();
        var productSearchHits = searchModel.getProductSearchHits();

        // Build array of "in stock" products, only as large as the number of products specified in the page designer component configuration
        while (productSearchHits.hasNext() && productsArray.length < productsToDisplay) {
            var productSearchHit = productSearchHits.next();
            var product = productSearchHit.product;

            if (product.availabilityModel.inStock) {
                productsArray.push(product);
            }
        }
    }

    res.render('experience/components/commerce_assets/sliderCategoryProductsInner', {
        products: productsArray,
        display: JSON.parse(display),
        section: req.querystring.section || ''
    });

    next();
});

module.exports = server.exports();
