'use strict';
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
var ProductHelper = require('*/cartridge/scripts/helpers/productHelpers.js');
var Context = require('*/cartridge/experience/utilities/context.js');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var component = context.component;
    var content = context.content;
    var product = content.product;
    var params = model.queryString;
    params.pid = params.pid || (product ? product.ID : content.testProductID); // fall back to testProductID while in edit mode
    var productHelperResult = ProductHelper.showProductPage(params, request.pageMetaData);

    model.regions = PageRenderHelper.getRegionModelRegistry(component);
    model.product = productHelperResult.product;
    model.addToCartUrl = productHelperResult.addToCartUrl;
    model.resources = productHelperResult.resources;
    model.canonicalUrl = productHelperResult.canonicalUrl;
    model.schemaData = productHelperResult.schemaData;
    model.CurrentPageMetaData = request.pageMetaData;
    model.containerClass = content.containerClass || '';

    // Fetch breadcrumb data from page context if it exists
    model.breadcrumbs = Context.context[1] && Context.context[1].length > 0 ? Context.context[1] : productHelperResult.breadcrumbs;

    if (PageRenderHelper.isInEditMode()) {
        model.yotpoWidgetData = {};
        model.commercePaymentsConfiguration = {};
        model.siteContext = {};
    } else {
        model.yotpoWidgetData = Context.context[3];
        model.commercePaymentsConfiguration = Context.context[4];
        model.siteContext = Context.context[5];
    }

    if (content.pdpImageColumnWidth !== 'inherit') {
        model.pdpImageColumnWidth = content.pdpImageColumnWidth;
    }

    // To support sets and bundles, new templates will need to be created and referenced here
    return new Template('experience/components/commerce_layouts/product/productDetails').render(model).text;
};
