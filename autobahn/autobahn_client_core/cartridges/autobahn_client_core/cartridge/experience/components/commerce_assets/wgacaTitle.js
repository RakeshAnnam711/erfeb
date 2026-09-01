'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

/**
 * Render logic for the assets.heroBanner
 */
module.exports.render = function (context, modelIn) {
	var model = modelIn || new HashMap();
    var content = context.content;

    model.titleContainerClass = content.titleContainerClass || '';
    model.title = content.title ? content.title : null;
    model.titleColor = content.titleColor ? content.titleColor : '#222222';
    model.titleFontSize = content.titleFontSize ? content.titleFontSize : null;
    model.titleAlignment = content.titleAlignment ? content.titleAlignment : null;
    model.letterSpacing = content.letterSpacing ? content.letterSpacing : null;

    return new Template('experience/components/commerce_assets/wgacaTitle').render(model).text;
};
