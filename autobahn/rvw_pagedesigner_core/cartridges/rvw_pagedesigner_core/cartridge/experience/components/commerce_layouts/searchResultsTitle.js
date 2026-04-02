'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    var category = content.category;

    model.categoryName = category ? category.displayName : null;
    model.customTitle = content.customTitle || null;
    model.customClass = content.customClass || '';
    model.hideTitle = content.hideTitle || false;

    return new Template('experience/components/commerce_layouts/search/searchResultsTitle').render(model).text;
};
