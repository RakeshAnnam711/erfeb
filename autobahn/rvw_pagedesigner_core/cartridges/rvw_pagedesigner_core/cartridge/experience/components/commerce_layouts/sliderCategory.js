'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');

var ProductSearch = require('*/cartridge/models/search/productSearch');
var SearchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
var sliderBuilder = require('*/cartridge/scripts/experience/utilities/sliderBuilder.js');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for storefront.carousel layout.
 * @param {dw.experience.ComponentScriptContext} context The component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 * @returns {string} The template to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    var category = content.category;
    var queryString = content.queryString;
    var params = queryString ? JSON.parse(queryString) : {};

    params.cgid = params.cgid ? params.cgid : category ? category.ID : null;
    params.sz = content.count || 12;

    // Passing price filtering as separate param in SearchHelper.setupSearch so setProductProperties in search.js can process it
    var priceParams = {};
    if ('pmin' in params) {
        priceParams.pmin = {
            value: params.pmin,
            doubleValue: parseInt(params.pmin, 10)
        }
    }
    if ('pmax' in params) {
        priceParams.pmax = {
            value: params.pmax,
            doubleValue: parseInt(params.pmax, 10)
        }
    }

    // Adding sort option to params if user selected from sort dropdown
    if (content.sort && content.sort.value !== 'none') {
        params.srule = content.sort.value;
    }

    var apiProductSearch = new ProductSearchModel();
    apiProductSearch = SearchHelper.setupSearch(apiProductSearch, params, priceParams);
    var defaultSortingRule = apiProductSearch.category && apiProductSearch.category.defaultSortingRule && apiProductSearch.category.defaultSortingRule.ID || null;
    var sortingRule = apiProductSearch.sortingRule ? apiProductSearch.sortingRule.ID : defaultSortingRule;

    // Populate refinement colors to preselect in tiles
    var refinementColors = null;
    if ('preferences' in params && !empty(params.preferences)) {
        Object.keys(params.preferences).forEach(function(key) {
            if (key === 'refinementColor') {
                refinementColors = {
                    key: key,
                    values: params.preferences[key]
                }
            }
            model.refinementValues = refinementColors;
        });
    }

    apiProductSearch.search();

    var productSearch = new ProductSearch(
        apiProductSearch,
        params,
        sortingRule,
        CatalogMgr.getSortingOptions(),
        CatalogMgr.getSiteCatalog().getRoot()
    );

    model.productResults = productSearch.productIds;
    model.displayRatings = content.displayRatings;
    model.displaySwatches = content.displaySwatches;
    model.displayQuickview = content.displayQuickview ? true : false;
    model.displayQuickAddToCart = content.displayQuickAddToCart ? true : false;
    model.useGrid = content.useGrid || false;

    if (model.useGrid) {
        model.containerClass = context.content.containerClass || '';
        model.title = context.content.textHeadline ? context.content.textHeadline : null;
        model.titleAlign = context.content.textHeadlineAlignment;
        model.titleClass = context.content.textHeadlineClass || '';

        var columnClass;

        switch(content.smGridColumns) {
            case 1:
                columnClass = 'col-12';
                break;
            case 2:
                columnClass = 'col-6';
                break;
            case 3:
                columnClass = 'col-4';
                break;
            default:
                columnClass = 'col-12';
        }
        switch(content.mdGridColumns) {
            case 1:
                columnClass = columnClass + ' col-md-12';
                break;
            case 2:
                columnClass = columnClass + ' col-md-6';
                break;
            case 3:
                columnClass = columnClass + ' col-md-4';
                break;
            case 4:
                columnClass = columnClass + ' col-md-3';
                break;
            case 6:
                columnClass = columnClass + ' col-md-2';
                break;
            default:
                columnClass = columnClass + ' col-md-4';
        }
        switch(content.lgGridColumns) {
            case 1:
                columnClass = columnClass + ' col-lg-12';
                break;
            case 2:
                columnClass = columnClass + ' col-lg-6';
                break;
            case 3:
                columnClass = columnClass + ' col-lg-4';
                break;
            case 4:
                columnClass = columnClass + ' col-lg-3';
                break;
            case 6:
                columnClass = columnClass + ' col-lg-2';
                break;
            default:
                columnClass = columnClass + ' col-lg-3';
        }

        model.columnClass = columnClass;
    } else {
        model = sliderBuilder.init(model, context);
    }


    return new Template('experience/components/commerce_layouts/categorySlider').render(model).text;
};
