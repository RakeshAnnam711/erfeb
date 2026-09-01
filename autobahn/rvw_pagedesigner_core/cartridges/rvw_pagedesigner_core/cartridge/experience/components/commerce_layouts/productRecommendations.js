'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
var ProductHelper = require('*/cartridge/scripts/helpers/productHelpers.js');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var component = context.component;
    var content = context.content;
    var product = content.product;
    var params = {pid: product ? product.ID : content.testProductID}; // fall back to testProductID while in edit mode
    var productHelperResult = ProductHelper.showProductPage(params, request.pageMetaData);

    model.regions = PageRenderHelper.getRegionModelRegistry(component);
    model.product = productHelperResult.product;
    model.containerClass = content.containerClass || '';

    return new Template('experience/components/commerce_layouts/product/productRecommendations').render(model).text;
};
