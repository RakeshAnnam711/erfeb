'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');

/**
 * Render logic for storefront.imageAndText component.
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commcerce Cloud Plattform.
 *
 * @returns {string} The markup to be displayed
 */
module.exports.render = function(context, modelIn) {
    var model = modelIn || new HashMap();
    var content = context.content;
    var expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    response.setExpires(expiry);
    // base data structure
    model.image = {
        src: {
            mobile: {},
            tablet: {},
            desktop: {}
        }
    };

    if (content.image) {
    	model.image = ImageTransformation.getScaledImage(content.image);
    }

    model.imageAlt = content.imageAlt || '';
    model.overlayHeading = content.overlayHeading || '';
    model.description = content.description || '';
    model.backgroundColor = content.backgroundColor;
    model.overlayAlignment = content.overlayAlignment;
    return new Template('experience/components/commerce_assets/imageAndOverlayText').render(model).text;
};
