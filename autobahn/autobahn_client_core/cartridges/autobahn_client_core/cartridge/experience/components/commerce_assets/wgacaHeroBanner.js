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
    var expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    response.setExpires(expiry);
    model.enableContainer = content.enableContainer ? 'container': '';
    model.contentClass = content.contentClass ? content.contentClass : null;
    model.heroBannerContainerClass = content.heroBannerContainerClass ? content.heroBannerContainerClass : null;
    model.contentBackgroundColorTablet = content.contentBackgroundColorTablet ? content.contentBackgroundColorTablet : null;
    model.contentBackgroundColorMobile = content.contentBackgroundColorMobile ? content.contentBackgroundColorMobile : null;

    model.desktopImage = ImageTransformation.getScaledImage(content.desktopImage);   
    if(content.mobileImage) {
    	model.mobileImage = ImageTransformation.getScaledImage(content.mobileImage);
    } else {
    	model.mobileImage = ImageTransformation.getScaledImage(content.desktopImage);
    }
    model.alt = content.alt ? content.alt : 'image';
    
    model.bannerLink = content.bannerLink ? content.bannerLink : null;
    
    model.textAndCtaPlacement = content.textAndCtaPlacement ? content.textAndCtaPlacement.toLowerCase() : null;
    
    model.textWidth = content.textWidth ? content.textWidth : null;
    model.textWidthTablet = content.textWidthTablet  ? content.textWidthTablet  : null;
    model.titleClass = content.titleClass ? content.titleClass : null;
    model.title = content.title ? content.title : null;
    model.titleColor = content.titleColor ? content.titleColor : null;
    model.titleColorMobile = content.titleColorMobile ? content.titleColorMobile : null;
    model.titleColorTablet = content.titleColorTablet ? content.titleColorTablet : null;
    model.titleFontSize = content.titleFontSize ? content.titleFontSize : null;
    model.titleFontSizeMobile = content.titleFontSizeMobile ? content.titleFontSizeMobile : null;
    model.titleFontSizeTablet = content.titleFontSizeTablet ? content.titleFontSizeTablet : null;
    model.contentAlignment = content.contentAlignment ? content.contentAlignment : null;

    model.subTitleClass = content.subTitleClass ? content.subTitleClass : null;
    model.subTitle = content.subTitle ? content.subTitle : null;
    model.subTitleColor = content.subTitleColor ? content.subTitleColor : null;
    model.subTitleColorMobile = content.subTitleColorMobile ? content.subTitleColorMobile : null;
    model.subTitleColorTablet = content.subTitleColorTablet ? content.subTitleColorTablet : null;
    model.subTitleFontSize = content.subTitleFontSize ? content.subTitleFontSize : null;
    model.subTitleFontSizeMobile = content.subTitleFontSizeMobile ? content.subTitleFontSizeMobile : null;
    model.subTitleFontSizeTablet = content.subTitleFontSizeTablet ? content.subTitleFontSizeTablet : null;

    model.buttonClass = content.buttonClass ? content.buttonClass : null;
    model.buttonText = content.buttonText ? content.buttonText : null;
    model.removeButtonBorder = content.removeButtonBorder;
    model.buttonStyle = content.buttonStyle;
    model.tertiaryButtonColor = content.tertiaryButtonColor;
    model.tertiaryButtonColorTablet = content.tertiaryButtonColorTablet;
    model.tertiaryButtonColorMobile = content.tertiaryButtonColorMobile;

    switch (content.contentStack) {
        case "Text displayed over image (default)":
            model.contentStack = 'flex-row';
            break;
        case "Text below image on tablet and smaller":
            model.contentStack = 'flex-column flex-md-column';
            model.contentClass = "content-center-tablet";
            break;
        case "Text below image on mobile":
            model.contentStack = 'flex-column flex-md-row';
            model.contentClass = "content-center-mobile";
            break;
        default: // Text in front of image (default)
            model.contentStack = 'flex-row';
    }

    return new Template('experience/components/commerce_assets/wgacaHeroBanner').render(model).text;
};
