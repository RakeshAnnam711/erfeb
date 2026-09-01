'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

/**
 * Render logic for the assets.heroBanner
 */
module.exports.render = function (context, modelIn) {
	var model = modelIn || new HashMap();
    var content = context.content;

    model.title = content.title ? content.title : null;
    model.titleHeadingTag = content.titleHeadingTag;
    model.titleAlignment = content.titleAlignment;
    model.textContainerClass = content.textContainerClass ? content.textContainerClass : null;
    model.bodyText = content.bodyText ?  content.bodyText : null;
    model.bodyTextAlignment = content.bodyTextAlignment;

    return new Template('experience/components/commerce_assets/seoTextBlock').render(model).text;
};
