'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var Context = require('*/cartridge/experience/utilities/context.js');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    var blogDynamicContent = Context.context[4]; // fetch additional values from page-level

    model.categoryName = blogDynamicContent.categoryName ? blogDynamicContent.categoryName : null;
    model.title = content.customTitle || blogDynamicContent.title || null;
    model.creationDate = blogDynamicContent.creationDate ? blogDynamicContent.creationDate : null;
    model.author = blogDynamicContent.author ? blogDynamicContent.author : null;
    model.containerClass = content.containerClass || '';
    model.customClass = content.customClass || '';
    model.hideTitle = content.hideTitle || false;

    return new Template('experience/components/commerce_layouts/blog/blogTitle').render(model).text;
};
