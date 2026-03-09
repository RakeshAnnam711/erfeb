'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

var ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');
var ViewDataModel = require('*/cartridge/experience/utilities/viewDataModel.js');

/**
 * Render logic for storefront.video component.
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 * @returns {string} The template to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = ViewDataModel(context, modelIn);
    var content = context.content;

    model.componentID = context.component.ID;
    model.type = content.type.toLowerCase();
    model.id = content.videoID;
    model.hideControls = model.type === 'hosted' ? false : content.hideControls;
    model.isAutoplay = !!content.autoplay;
    model.playWhenFullyInView = content.playWhenFullyInView || false;
    model.modal = content.modal;
    model.containerClass = content.containerClass || '';

    if (model.type === 'hosted') {
        var fileNameArray = content.videoID.split('.');
        model.fileType = fileNameArray[fileNameArray.length - 1];
    }

    if (content.thumbnailImage) {
        model.thumbnailImage = {
            alt: content.thumbnailImage.file.getAlt() || '',
            focalPointX: (content.thumbnailImage.focalPoint.x * 100) + '%',
            focalPointY: (content.thumbnailImage.focalPoint.y * 100) + '%',
            src: {
                mobile: ImageTransformation.url(content.thumbnailImage, { device: 'mobile' }),
                mobile2x: ImageTransformation.url(content.thumbnailImage, { device: 'mobile2x' }),
                tablet: ImageTransformation.url(content.thumbnailImage, { device: 'tablet' }),
                tablet2x: ImageTransformation.url(content.thumbnailImage, { device: 'tablet2x' }),
                desktop: ImageTransformation.url(content.thumbnailImage, { device: 'desktop' }),
                desktop2x: ImageTransformation.url(content.thumbnailImage, { device: 'desktop2x' })
            }
        };
    } else {
        model.thumbnailImage = null;
    }

    switch (content.aspectRatio) {
        case '4:3':
            model.aspectRatioClass = 'aspect-ratio-4-3';
            break;
        case '3:4':
            model.aspectRatioClass = 'aspect-ratio-3-4';
            break;
        case '9:16':
            model.aspectRatioClass = 'aspect-ratio-9-16';
            break;
        case '1:1':
            model.aspectRatioClass = 'aspect-ratio-1-1';
            break;
        default: // 16:9
            model.aspectRatioClass = 'aspect-ratio-16-9';
    }

    var params = {
        modal: model.modal,
        inline: !model.modal,
        autoplay: content.autoplay ? 1 : 0,
        mute: content.mute ? 1 : 0,
        controls: content.hideControls ? 0 : 1,
        showinfo: content.hideControls ? 0 : 1,
        loop: content.loop ? 1 : 0,
        hasThumb: true
    }

    model.params = JSON.stringify(params);

    return new Template('experience/components/commerce_assets/video').render(model).text;
};
