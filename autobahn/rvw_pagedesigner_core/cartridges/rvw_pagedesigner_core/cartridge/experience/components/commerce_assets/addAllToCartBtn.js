
'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;

    model.componentID = context.component.ID;
    model.containerClass = content.containerClass || '';
    model.buttonText = content.buttonText || '';
    model.buttonStyle = 'btn-' + content.buttonStyle.toLowerCase();
    model.buttonClass = content.buttonClass || '';
    model.buttonType = content.buttonType;
    model.productID = content.productID.replace(/[^a-zA-Z0-9(\-) ]/g, "").replace(/[' ']/g, '-');

    return new Template('experience/components/commerce_assets/addAllToCartBtn').render(model).text;
};
