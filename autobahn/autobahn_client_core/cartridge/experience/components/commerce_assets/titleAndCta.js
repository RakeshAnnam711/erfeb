'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');

/**
 * Render logic for the assets.heroBanner
 */
module.exports.render = function (context, modelIn) {
	var model = modelIn || new HashMap();
    var content = context.content;

    model.textContainerClass = content.textContainerClass || '';
    model.textContainerBackgroundColorMobile = content.textContainerBackgroundColorMobile || '';
    model.titleClass = content.titleClass || '';
    model.title = content.title ? content.title : null;
    model.titleColor = content.titleColor ? content.titleColor : null;
    model.titleFontSize = content.titleFontSize ? content.titleFontSize : null;
    model.titleFontSizeMobile = content.titleFontSizeMobile ? content.titleFontSizeMobile : null;
    model.titleAlignment = content.titleAlignment;
    
    model.subTitleContainerClass = content.subTitleContainerClass || '';
    model.subTitleWidth = content.subTitleWidth ? content.subTitleWidth : null;
    model.subTitle = content.subTitle ? content.subTitle : null;
    model.subTitleColor = content.subTitleColor ? content.subTitleColor : null;
    model.SubTitleFontSize = content.SubTitleFontSize ? content.SubTitleFontSize : null;
    model.subTitleFontSizeMobile = content.subTitleFontSizeMobile ? content.subTitleFontSizeMobile : null;
    model.SubTitleAlignment = content.SubTitleAlignment;

    model.shopButtonDiv = content.shopButtonDiv;
    
    model.buttonContainerClass = content.buttonContainerClass || '';
    model.buttonText = content.buttonText ? content.buttonText : null;
    model.buttonStyle = content.buttonStyle;
    model.buttonAlignment = content.buttonAlignment;
    model.ctaUrl = content.ctaUrl ? content.ctaUrl : null;
    model.ctaAriaLabel = content.ctaAriaLabel ? content.ctaAriaLabel : null;

    return new Template('experience/components/commerce_assets/titleAndCta').render(model).text;
};
