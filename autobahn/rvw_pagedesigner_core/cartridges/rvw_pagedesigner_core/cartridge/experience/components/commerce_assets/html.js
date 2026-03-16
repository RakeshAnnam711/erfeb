'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for the assets.rawHTML.
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;
    var assetId = null;

    if (content.html) {

        // Check if it's a content asset include, and get the ID
        var asset = content.html.match(/^<iscontentasset.*\/>$/);
        if (asset) {
            assetId = asset[0].split(/["']/g)[1].replace(/["']/g, "");
            content.html = '';
        }

        model.html = content.html;
        model.assetId = assetId;
        model.containerClass = content.containerClass || '';
    }

    return new Template('experience/components/commerce_assets/html').render(model).text;
};
