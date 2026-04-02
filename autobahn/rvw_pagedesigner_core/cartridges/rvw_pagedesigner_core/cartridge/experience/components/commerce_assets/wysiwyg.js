'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for assets.wysiwyg.
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    model.containerClass = content.containerClass || '';

    if (content.wysiwyg) {
        model.wysiwyg = content.wysiwyg;
    }

    return new Template('experience/components/commerce_assets/wysiwyg').render(model).text;
};
