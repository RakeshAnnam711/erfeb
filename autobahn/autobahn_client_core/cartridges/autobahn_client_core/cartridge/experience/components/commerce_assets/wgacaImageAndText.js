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

    model.desktopImage = ImageTransformation.getScaledImage(content.desktopImage);
    if(content.mobileImage) {
    	model.mobileImage = ImageTransformation.getScaledImage(content.mobileImage);
    } else {
    	model.mobileImage = ImageTransformation.getScaledImage(content.desktopImage);
    }
    model.alt = content.alt ? content.alt : 'image';
    
    model.imageContainerClass = content.imageContainerClass ? content.imageContainerClass : null;
    model.imageClass = content.imageClass ? content.imageClass : null;
    model.shopButtonDiv = content.shopButtonDiv;
    model.buttonClass = content.buttonClass ? content.buttonClass : null;
    model.buttonText = content.buttonText ? content.buttonText : null;
    model.buttonTextColor = content.buttonTextColor ? content.buttonTextColor : null;
    model.buttonStyle = content.buttonStyle;
    model.buttonAlignment = content.buttonAlignment;
    model.ctaUrl = content.ctaUrl ? content.ctaUrl : null;
    model.ctaImageAndTextAriaLabel = content.ctaImageAndTextAriaLabel ? content.ctaImageAndTextAriaLabel : null;

    model.titleClass = content.titleClass ? content.titleClass : null;
    model.TextContent = content.TextContent ? content.TextContent : null;
    model.TextFontSize = content.TextFontSize ? content.TextFontSize : null;
    model.titleColor = content.titleColor ? content.titleColor : null;
    model.subTitleClass = content.subTitleClass ? content.subTitleClass : null;
    model.subTitle = content.subTitle ? content.subTitle : null;
    model.subTitleColor = content.subTitleColor ? content.subTitleColor : null;
    model.subTitleFontSize = content.subTitleFontSize ? content.subTitleFontSize : null;

    var ariaLabel = content.ctaImageAndTextAriaLabel;
    var ariaPrefix = null;

    if (ariaLabel && ariaLabel.indexOf(':') > -1) {
        ariaPrefix = ariaLabel.split(':')[0].trim(); // extract before colon
    }

    model.ariaPrefix = ariaPrefix;
    
    return new Template('experience/components/commerce_assets/wgacaImageAndText').render(model).text;
};
