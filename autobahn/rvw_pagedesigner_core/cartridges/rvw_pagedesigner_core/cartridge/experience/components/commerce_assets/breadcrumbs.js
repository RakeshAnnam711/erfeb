'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for the assets.breadcrumbs.
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    var breadcrumbs = [];
    var fullBreadcrumbs = [];

    if (!empty(content.pd_breadcrumbCategory)) {
        fullBreadcrumbs = pdGetBreadcrumbsCategory(content.pd_breadcrumbCategory.ID, breadcrumbs, content.customTitle);
    }
    else if (!empty(content.pd_breadcrumb1)) {
        fullBreadcrumbs = pdGetBreadCrumbsAll(content, breadcrumbs);
    }

    model.containerClass = content.containerClass || '';
    model.breadcrumbs = fullBreadcrumbs;

    return new Template('experience/components/commerce_assets/breadcrumbs').render(model).text;
};

//the category bit is copied from the controllers/Search.js file
function pdGetBreadcrumbsCategory(categoryID, breadcrumbs, customTitle) {
    var category = CatalogMgr.getCategory(categoryID);
    var categoryName = customTitle || category.displayName;

    if (!empty(category) && !category.isRoot()) {
        breadcrumbs.push({
            // WGACA MODIFICATION - remove additional h1 tags
            // htmlValue: '<h1>' + categoryName + '</h1>',
            htmlValue: categoryName,
            url: ''
        })

        var parentCategory = category;
        while (!parentCategory.isTopLevel()) {
            parentCategory = parentCategory.parent;
            breadcrumbs.unshift({
                htmlValue: parentCategory.displayName,
                url: URLUtils.url('Search-Show', 'cgid', parentCategory.ID).toString()
            });
        }
    }
    breadcrumbs.unshift({
        htmlValue: Resource.msg('global.home', 'common', null),
        url: URLUtils.home().toString()
    });
    return breadcrumbs;
};

function pdGetBreadCrumbsAll(content, breadcrumbs) {
    if (!empty(content.pd_breadcrumb1)) {
        breadcrumbs.push({
            htmlValue: content.pd_breadcrumbDisplay1,
            url: content.pd_breadcrumb1
        })
    }
    if (!empty(content.pd_breadcrumb2)) {
        breadcrumbs.push({
            htmlValue: content.pd_breadcrumbDisplay2,
            url: content.pd_breadcrumb2
        })
    }
    if (!empty(content.pd_breadcrumb3)) {
        breadcrumbs.push({
            htmlValue: content.pd_breadcrumbDisplay3,
            url: content.pd_breadcrumb3
        })
    }

    breadcrumbs.unshift({
        htmlValue: Resource.msg('global.home', 'common', null),
        url: URLUtils.home().toString()
    });
    return breadcrumbs;
};
