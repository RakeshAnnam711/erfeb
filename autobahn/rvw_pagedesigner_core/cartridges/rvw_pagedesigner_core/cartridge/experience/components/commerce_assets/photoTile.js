'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');
var ContentImageBreakpoints = require('*/cartridge/experience/breakpoints');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for the storefront.photoTile component.
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 *
 * @returns {string} The markup to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;

    model.customImageAlt = content.customImageAlt || '';
    model.breakpoints = ContentImageBreakpoints;
    model.containerClass = content.containerClass || '';
    model.maxWidth = content.maxWidth || '';

    model.image = {
        alt: content.image.file.getAlt() || '',
        focalPointX: (content.image.focalPoint.x * 100) + '%',
        focalPointY: (content.image.focalPoint.y * 100) + '%',
        src: {
            mobile: ImageTransformation.url(content.image, { device: 'mobile' }),
            mobile2x: ImageTransformation.url(content.image, { device: 'mobile2x' }),
            tablet: ImageTransformation.url(content.image, { device: 'tablet' }),
            tablet2x: ImageTransformation.url(content.image, { device: 'tablet2x' }),
            desktop: ImageTransformation.url(content.image, { device: 'desktop' }),
            desktop2x: ImageTransformation.url(content.image, { device: 'desktop2x' })
        }
    };

    return new Template('experience/components/commerce_assets/photoTile').render(model).text;
};
