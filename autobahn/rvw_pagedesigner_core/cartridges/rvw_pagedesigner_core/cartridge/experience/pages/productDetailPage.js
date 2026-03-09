'use strict';
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var URLUtils = require('dw/web/URLUtils');

var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
var Context = require('*/cartridge/experience/utilities/context.js');
var Url = require('*/cartridge/experience/utilities/url.js');
var Cache = require('*/cartridge/experience/utilities/cache.js');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for the product detail page.
 *
 * @param {dw.experience.PageScriptContext} context The page script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 *
 * @returns {string} The markup to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var content = context.content;
    // WGACA MODIFICATION - missing product context
    model.product = !empty(content.product) ? {id: content.product && content.product.ID } : model.product;

    // Apply response cache
    Cache.applyInventorySensitiveCache(response);

    // automatically register configured regions
    model.regions = PageRenderHelper.getRegionModelRegistry(model.page);

    if (model.product) {
        var params = { pid: model.product.id };
        var product = ProductFactory.get(params);

        pageMetaHelper.setPageMetaData(request.pageMetaData, product);
        pageMetaHelper.setPageMetaTags(request.pageMetaData, product);

        model.canonicalUrl = URLUtils.abs('Product-Show', 'pid', product.id).toString();
    }

    // Add data to Context object in order to fetch from child templates
    Context.addContext(model.queryString || null);
    Context.addContext(model.breadcrumbs || null);
    Context.addContext(null);
    Context.addContext(model.yotpoWidgetData || {});
    Context.addContext(model.commercePaymentsConfiguration || {});
    Context.addContext(model.siteContext || {});

    // call a hook and reset client side data when rendering inside the Page Designer
    if (PageRenderHelper.isInEditMode()) {
        var HookManager = require('dw/system/HookMgr');
        HookManager.callHook('app.experience.editmode', 'editmode');
        model.resetEditPDMode = true;
        model.CurrentPageMetaData = {};
    }

    // Custom page attributes
    model.transparentNavShow = content.transparentNavShow;
    model.transparentNavDarkMode = content.transparentNavDarkMode;
    model.customClass = context.content.customClass || '';

    // adding CurrentHttpParameterMap to the pdict so we don't break certain link cartridges
    model.CurrentHttpParameterMap = request.httpParameterMap;

    // render the page
    var ajaxRegion = Url.getUrlParameter('ajaxRegion', '?' + model.queryString); // populated when page is requested via ajax
    if (!empty(ajaxRegion)) {
        model.ajaxRegion = ajaxRegion;
        return new Template('experience/pages/ajaxRegion').render(model).text;
    } else {
        model.belowFoldPopulated = model.regions.belowFold.region.size > 0; // check for contents in belowFold region
        return new Template('experience/pages/productDetailPage').render(model).text;
    }
};
