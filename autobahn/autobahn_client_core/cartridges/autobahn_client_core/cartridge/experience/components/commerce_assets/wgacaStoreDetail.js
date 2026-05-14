'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

/**
 * Render logic for the assets.heroBanner
 */
module.exports.render = function (context, modelIn) {
	var model = modelIn || new HashMap();
    var content = context.content;
    var expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    response.setExpires(expiry);
    model.title = content.title ? content.title : null;
    model.titleColor = content.titleColor ? content.titleColor : '#222222';
    model.titleFontSize = content.titleFontSize ? content.titleFontSize : null;
    model.letterSpacing = content.letterSpacing ? content.letterSpacing : null;
    
    model.subTitle = content.subTitle ? content.subTitle : null;
    model.subTitleColor = content.subTitleColor ? content.subTitleColor : '#222222';
    model.subTitleFontSize = content.subTitleFontSize ? content.subTitleFontSize : null;
    model.subTitleLetterSpacing = content.subTitleLetterSpacing ? content.subTitleLetterSpacing : null;
    
    model.buttonText = content.buttonText ? content.buttonText : null;
    model.buttonStyle = content.buttonStyle;
    model.ctaUrl = content.ctaUrl ? content.ctaUrl : null;
    
    model.storeDescription = content.storeDescription ? content.storeDescription : null;
    
    model.storeTimings = content.storeTimings ? content.storeTimings : null;
    model.storeContact = content.storeContact ? content.storeContact : null;

    return new Template('experience/components/commerce_assets/wgacaStoreDetail').render(model).text;
};
